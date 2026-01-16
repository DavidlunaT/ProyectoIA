import pickle
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
from datetime import datetime
import warnings

# Ignorar advertencias
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

app = FastAPI()

# --- CONFIGURACIÓN ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "../model")

# --- CARGAR MODELO ---
print("Cargando modelo XGBoost...")
try:
    with open(os.path.join(MODEL_DIR, "modelo_xgb_riesgos.pkl"), "rb") as f:
        model = pickle.load(f)
    with open(os.path.join(MODEL_DIR, "scaler_coords.pkl"), "rb") as f:
        scaler = pickle.load(f)
    with open(os.path.join(MODEL_DIR, "map_eventos.pkl"), "rb") as f:
        evento_to_id = pickle.load(f)
        id_to_evento = {v: k for k, v in evento_to_id.items()}
    print("XGBoost cargado correctamente.")
except Exception as e:
    print(f"Error cargando modelo: {e}")
    model = None

# --- ESQUEMA CORRECTO (Adaptado a tu Go Backend) ---
class PredictionRequest(BaseModel):
    latitude: float
    longitude: float
    day: int
    month: int
    provincia: str = "" # Opcionales para no romper si no llegan
    canton: str = ""
    parroquia: str = ""

@app.get("/health")
def health_check():
    if model is None:
        raise HTTPException(status_code=503, detail="Modelo no cargado")
    return {"status": "online", "model": "XGBoost"}

@app.post("/predict")
def predict_risk(request: PredictionRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Modelo no disponible")

    try:
        # 1. CALCULAR DÍA DEL AÑO
        # Usamos el año 2024 (bisiesto) para que no falle si ponen 29 de Feb
        try:
            date_obj = datetime(2024, request.month, request.day)
            day_of_year = date_obj.timetuple().tm_yday
        except ValueError:
             raise HTTPException(status_code=400, detail="Fecha inválida (ej: 30 de Febrero)")

        # 2. TRANSFORMACIÓN TRIGONOMÉTRICA
        day_sin = np.sin(2 * np.pi * day_of_year / 365.0)
        day_cos = np.cos(2 * np.pi * day_of_year / 365.0)

        # 3. ESCALAR COORDENADAS
        # El scaler espera [[lat, long]]
        coords_raw = np.array([[request.latitude, request.longitude]])
        coords_norm = scaler.transform(coords_raw)
        lat_norm = coords_norm[0][0]
        long_norm = coords_norm[0][1]

        # 4. PREPARAR DATAFRAME (Orden exacto del entrenamiento)
        features = pd.DataFrame([[lat_norm, long_norm, day_sin, day_cos]], 
                                columns=["LAT_NORM", "LONG_NORM", "day_sin", "day_cos"])

        # 5. PREDICCIÓN
        pred_probs = model.predict_proba(features)[0]
        
        # Formatear respuesta para que coincida con lo que espera Go
        predictions_list = []
        
        # Recorremos todas las clases para devolver sus probabilidades
        for i, prob in enumerate(pred_probs):
            event_name = id_to_evento.get(i, f"Evento_{i}")
            
            # Definir nivel de riesgo básico según probabilidad
            risk_level = "Bajo"
            if prob > 0.3: risk_level = "Medio"
            if prob > 0.6: risk_level = "Alto"
            if prob > 0.8: risk_level = "Extremo"
            
            # Si es "NINGUNO", el riesgo suele ser bajo a menos que sea muy incierto
            if event_name == "NINGUNO" and prob > 0.5:
                risk_level = "Bajo"

            predictions_list.append({
                "event_type": event_name,
                "probability": float(prob),
                "risk_level": risk_level
            })

        # Ordenar: Mayor probabilidad primero
        predictions_list.sort(key=lambda x: x["probability"], reverse=True)

        return {
            "success": True,
            "predictions": predictions_list
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))