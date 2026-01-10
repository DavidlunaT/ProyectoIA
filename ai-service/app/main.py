import os
import pickle
import numpy as np
import tensorflow as tf
from math import sin, cos, pi
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

app = FastAPI(title="AI Service - Production Model")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas de archivos
BASE_PATH = "/app/model"
MODEL_PATH = os.path.join(BASE_PATH, "modelo_final_riesgos_ecuador.keras")
MAP_PARROQUIAS_PATH = os.path.join(BASE_PATH, "map_parroquias.pkl")
MAP_EVENTOS_PATH = os.path.join(BASE_PATH, "map_eventos.pkl")

# Variables globales
model = None
map_parroquias = {}
id_to_evento = {}

# Límites para normalización (según entrenamiento)
LAT_MIN, LAT_MAX = -5.01, 1.44
LON_MIN, LON_MAX = -81.08, -75.19

# ============================================================================
# CARGA DE RECURSOS
# ============================================================================

@app.on_event("startup")
async def load_resources():
    global model, map_parroquias, id_to_evento
    print("🚀 Iniciando carga de recursos del sistema...")

    # 1. Cargar Mapa de Parroquias
    try:
        if os.path.exists(MAP_PARROQUIAS_PATH):
            with open(MAP_PARROQUIAS_PATH, 'rb') as f:
                map_parroquias = pickle.load(f)
            print(f"✅ Mapa de parroquias cargado ({len(map_parroquias)} registros)")
        else:
            print(f"⚠️ ERROR: No se encontró {MAP_PARROQUIAS_PATH}")
    except Exception as e:
        print(f" Error cargando map_parroquias: {e}")

    # 2. Cargar Mapa de Eventos
    try:
        if os.path.exists(MAP_EVENTOS_PATH):
            with open(MAP_EVENTOS_PATH, 'rb') as f:
                evento_to_id = pickle.load(f)
            # Invertir diccionario (Nombre -> ID) a (ID -> Nombre) para la respuesta
            id_to_evento = {v: k for k, v in evento_to_id.items()}
            print(f"Mapa de eventos cargado y procesado ({len(id_to_evento)} tipos)")
        else:
            print(f" ERROR: No se encontró {MAP_EVENTOS_PATH}")
    except Exception as e:
        print(f" Error cargando map_eventos: {e}")

    # 3. Cargar Modelo Keras
    try:
        if os.path.exists(MODEL_PATH):
            model = tf.keras.models.load_model(MODEL_PATH)
            print(" Modelo .keras cargado exitosamente")
        else:
            print(f" ERROR: No se encontró modelo en {MODEL_PATH}")
    except Exception as e:
        print(f" Error cargando modelo: {e}")

# ============================================================================
# LÓGICA DE PREPROCESAMIENTO
# ============================================================================

def get_risk_level(prob):
    if prob >= 75: return "crítico"
    if prob >= 50: return "alto"
    if prob >= 25: return "medio"
    return "bajo"

def normalize_text(text):
    """Normaliza texto para coincidir con las llaves del mapa (mayúsculas)"""
    return text.upper().strip() if text else ""

# ============================================================================
# ENDPOINTS
# ============================================================================

class PredictionRequest(BaseModel):
    latitude: float
    longitude: float
    day: int
    month: int
    provincia: str
    canton: str
    parroquia: str = None 

class EventProbability(BaseModel):
    event_type: str
    probability: float
    risk_level: str

class PredictionResponse(BaseModel):
    success: bool
    predictions: list[EventProbability]
    model_version: str = "v3.0-production"

    model_config = {"protected_namespaces": ()}

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    global model, map_parroquias, id_to_evento

    if model is None:
        raise HTTPException(status_code=503, detail="Modelo no disponible")

    try:
        # --- PASO 1: PREPARAR ID DE PARROQUIA (Entrada 1) ---
        # Buscamos por parroquia o usamos el cantón como fallback
        search_key = normalize_text(request.parroquia if request.parroquia else request.canton)
        
        # Obtener ID del mapa, default 0 si no existe
        parroquia_id = map_parroquias.get(search_key, 0)
        
        # Shape: (1,)
        input_parroquia = np.array([parroquia_id]) 

        # --- PASO 2: PREPARAR CONTEXTO (Entrada 2) ---
        # Normalización manual de coordenadas (MinMax)
        lat_norm = (request.latitude - LAT_MIN) / (LAT_MAX - LAT_MIN)
        lon_norm = (request.longitude - LON_MIN) / (LON_MAX - LON_MIN)
        
        # Transformación trigonométrica de fecha
        d_sin = np.sin(2 * np.pi * request.day / 365.0)
        d_cos = np.cos(2 * np.pi * request.day / 365.0)
        m_sin = np.sin(2 * np.pi * request.month / 12.0)
        m_cos = np.cos(2 * np.pi * request.month / 12.0)
        
        # Shape: (1, 6) -> [[lat, lon, d_sin, d_cos, m_sin, m_cos]]
        input_contexto = np.array([[lat_norm, lon_norm, d_sin, d_cos, m_sin, m_cos]])

        print(f" Prediciendo para: {search_key} (ID: {parroquia_id})")

        # --- PASO 3: INFERENCIA ---
        # El modelo espera una lista: [input_parroquia, input_contexto]
        predictions_raw = model.predict([input_parroquia, input_contexto])
        
        # --- PASO 4: FORMATEAR RESPUESTA ---
        results = []
        probs_vector = predictions_raw[0] # Primera fila

        for idx, prob in enumerate(probs_vector):
            # Obtener nombre del evento usando el ID invertido
            event_name = id_to_evento.get(idx, f"Evento_{idx}")
            
            # Ignorar clase 'NINGUNO' si se desea filtrar, o mostrarla
            if event_name == "NINGUNO":
                continue 

            p_val = float(prob) * 100 # Convertir 0.12 -> 12.0
            
            results.append(EventProbability(
                event_type=event_name,
                probability=round(p_val, 2),
                risk_level=get_risk_level(p_val)
            ))

        # Ordenar de mayor a menor probabilidad
        results.sort(key=lambda x: x.probability, reverse=True)

        # Devolver top 5 para no saturar el frontend
        return PredictionResponse(success=True, predictions=results[:5])

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}