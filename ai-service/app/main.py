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
ID_OTRA = 0
is_loading = True # Flag para saber si seguimos cargando

# Límites para normalización (según entrenamiento)
LAT_MIN, LAT_MAX = -5.01, 1.44
LON_MIN, LON_MAX = -81.08, -75.19

# ============================================================================
# CARGA DE RECURSOS
# ============================================================================

@app.on_event("startup")
def load_resources():
    """Carga síncrona de recursos al iniciar la app"""
    global model, map_parroquias, id_to_evento, ID_OTRA, is_loading
    print("🚀 Iniciando carga de recursos del sistema (Modo Síncrono)...")

    # 1. Cargar Mapa de Parroquias
    try:
        if os.path.exists(MAP_PARROQUIAS_PATH):
            with open(MAP_PARROQUIAS_PATH, 'rb') as f:
                map_parroquias = pickle.load(f)
            
            if "OTRA" in map_parroquias:
                ID_OTRA = map_parroquias["OTRA"]
                print(f"Mapa de parroquias cargado. ID OTRA: {ID_OTRA}")
            else:
                print("ADVERTENCIA: La etiqueta 'OTRA' no está. Usando 0.")
                ID_OTRA = 0
        else:
            print(f"ERROR: No se encontró {MAP_PARROQUIAS_PATH}")
    except Exception as e:
        print(f"Error cargando map_parroquias: {e}")

    # 2. Cargar Mapa de Eventos
    try:
        if os.path.exists(MAP_EVENTOS_PATH):
            with open(MAP_EVENTOS_PATH, 'rb') as f:
                evento_to_id = pickle.load(f)
            id_to_evento = {v: k for k, v in evento_to_id.items()}
            print(f"Mapa de eventos cargado ({len(id_to_evento)} tipos)")
        else:
            print(f"ERROR: No se encontró {MAP_EVENTOS_PATH}")
    except Exception as e:
        print(f"Error cargando map_eventos: {e}")

    # 3. Cargar Modelo Keras
    try:
        if os.path.exists(MODEL_PATH):
            # Optimización: Cargar solo para inferencia (compile=False es más rápido)
            model = tf.keras.models.load_model(MODEL_PATH, compile=False)
            print("Modelo .keras cargado exitosamente")
        else:
            print(f"ERROR: No se encontró modelo en {MODEL_PATH}")
    except Exception as e:
        print(f"Error cargando modelo: {e}")
    
    is_loading = False
    print("🏁 Carga de recursos finalizada.")

# ============================================================================
# ENDPOINTS DE CONTROL Y SALUD
# ============================================================================

@app.get("/health")
def health():
    """Responde rápido para que Docker sepa que el servidor web está vivo"""
    if is_loading:
        return {"status": "loading", "ready": False}
    return {"status": "ok", "ready": model is not None}

# ============================================================================
# LÓGICA DE PREDICCIÓN (Igual que antes)
# ============================================================================

def get_risk_level(prob):
    if prob >= 75: return "crítico"
    if prob >= 50: return "alto"
    if prob >= 25: return "medio"
    return "bajo"

def normalize_text(text):
    return text.upper().strip() if text else ""

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
def predict(request: PredictionRequest):
    # Validar disponibilidad
    if model is None:
        if is_loading:
            raise HTTPException(status_code=503, detail="El modelo se está cargando, intente en unos segundos")
        raise HTTPException(status_code=500, detail="Modelo no disponible (error de carga)")

    try:
        search_key = normalize_text(request.parroquia if request.parroquia else request.canton)
        parroquia_id = map_parroquias.get(search_key, ID_OTRA)

        if parroquia_id == ID_OTRA and search_key != "OTRA":
            print(f"ℹ️ Parroquia '{search_key}' no encontrada -> ID {ID_OTRA}.")
        
        input_parroquia = np.array([parroquia_id]) 

        lat_norm = (request.latitude - LAT_MIN) / (LAT_MAX - LAT_MIN)
        lon_norm = (request.longitude - LON_MIN) / (LON_MAX - LON_MIN)
        d_sin = np.sin(2 * np.pi * request.day / 365.0)
        d_cos = np.cos(2 * np.pi * request.day / 365.0)
        m_sin = np.sin(2 * np.pi * request.month / 12.0)
        m_cos = np.cos(2 * np.pi * request.month / 12.0)
        
        input_contexto = np.array([[lat_norm, lon_norm, d_sin, d_cos, m_sin, m_cos]])

        # Inferencia
        predictions_raw = model.predict([input_parroquia, input_contexto], verbose=0) # verbose=0 silencia logs
        
        results = []
        probs_vector = predictions_raw[0]

        for idx, prob in enumerate(probs_vector):
            event_name = id_to_evento.get(idx, f"Evento_{idx}")
            if event_name == "NINGUNO": continue 

            p_val = float(prob) * 100
            results.append(EventProbability(
                event_type=event_name,
                probability=round(p_val, 2),
                risk_level=get_risk_level(p_val)
            ))

        results.sort(key=lambda x: x.probability, reverse=True)
        return PredictionResponse(success=True, predictions=results[:5])

    except Exception as e:
        print(f"Error predicción: {e}")
        raise HTTPException(status_code=500, detail=str(e))