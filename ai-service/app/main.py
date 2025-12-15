"""
Sistema de Predicción de Eventos Catastróficos en Ecuador
AI Service - Servicio de Inteligencia Artificial (Mock)

Este servicio actualmente funciona en modo MOCK, generando valores aleatorios
que respetan el contrato de datos para facilitar la integración futura.
"""

import random
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ============================================================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ============================================================================

app = FastAPI(
    title="AI Service - Predicción de Eventos Catastróficos",
    description="Servicio de IA para predicción de eventos catastróficos en Ecuador",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# MODELOS DE DATOS (Contratos)
# ============================================================================

class PredictionRequest(BaseModel):
    """Estructura de la petición de predicción"""
    latitude: float = Field(..., ge=-5.0, le=2.0, description="Latitud en Ecuador")
    longitude: float = Field(..., ge=-81.0, le=-75.0, description="Longitud en Ecuador")
    day: int = Field(..., ge=1, le=31, description="Día del mes")
    month: int = Field(..., ge=1, le=12, description="Mes del año")
    provincia: str = Field(..., min_length=1, description="Nombre de la provincia")
    canton: str = Field(..., min_length=1, description="Nombre del cantón")
    
    class Config:
        json_schema_extra = {
            "example": {
                "latitude": -2.1894,
                "longitude": -79.8891,
                "day": 15,
                "month": 12,
                "provincia": "Guayas",
                "canton": "Guayaquil"
            }
        }


class EventProbability(BaseModel):
    """Probabilidad de un evento específico"""
    event_type: str = Field(..., description="Tipo de evento catastrófico")
    probability: float = Field(..., ge=0.0, le=100.0, description="Probabilidad en porcentaje")
    risk_level: str = Field(..., description="Nivel de riesgo: bajo, medio, alto, crítico")


class PredictionResponse(BaseModel):
    """Estructura de la respuesta de predicción"""
    success: bool
    timestamp: str
    location: dict
    predictions: list[EventProbability]
    model_version: str
    is_mock: bool = Field(default=True, description="Indica si es una respuesta mock")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "timestamp": "2025-12-15T10:30:00",
                "location": {
                    "provincia": "Guayas",
                    "canton": "Guayaquil",
                    "coordinates": {"lat": -2.1894, "lng": -79.8891}
                },
                "predictions": [
                    {"event_type": "Inundación", "probability": 45.5, "risk_level": "medio"},
                    {"event_type": "Deslizamiento", "probability": 23.2, "risk_level": "bajo"},
                    {"event_type": "Incendio", "probability": 12.8, "risk_level": "bajo"},
                    {"event_type": "Sismo", "probability": 8.5, "risk_level": "bajo"}
                ],
                "model_version": "mock-v1.0.0",
                "is_mock": True
            }
        }


# ============================================================================
# CARGA DEL MODELO DE IA
# ============================================================================

# AQUÍ SE CARGARÁ EL MODELO .KERAS EN EL FUTURO Y SE REEMPLAZARÁ ESTA LÓGICA MOCK
# 
# Ejemplo de carga futura:
# 
# import tensorflow as tf
# from tensorflow import keras
# import numpy as np
# 
# MODEL_PATH = "/app/model/disaster_prediction_model.keras"
# model = None
# 
# @app.on_event("startup")
# async def load_model():
#     global model
#     try:
#         model = keras.models.load_model(MODEL_PATH)
#         print(f"✅ Modelo cargado exitosamente desde {MODEL_PATH}")
#     except Exception as e:
#         print(f"⚠️ Error cargando modelo: {e}")
#         print("Continuando en modo MOCK...")

MODEL_LOADED = False  # Cambiar a True cuando el modelo real esté disponible


# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

def get_risk_level(probability: float) -> str:
    """Determina el nivel de riesgo basado en la probabilidad"""
    if probability >= 75:
        return "crítico"
    elif probability >= 50:
        return "alto"
    elif probability >= 25:
        return "medio"
    else:
        return "bajo"


def generate_mock_predictions(request: PredictionRequest) -> list[EventProbability]:
    """
    Genera predicciones mock aleatorias.
    
    AQUÍ SE REEMPLAZARÁ CON LA LÓGICA REAL DEL MODELO .KERAS EN EL FUTURO
    
    Futuro código:
    
    def generate_real_predictions(request: PredictionRequest) -> list[EventProbability]:
        # Preparar features para el modelo
        features = np.array([[
            request.latitude,
            request.longitude,
            request.month,
            # ... otros features procesados
        ]])
        
        # Ejecutar predicción
        raw_predictions = model.predict(features)
        
        # Procesar salida del modelo
        event_types = ["Inundación", "Deslizamiento", "Incendio", "Sismo"]
        predictions = []
        for i, event_type in enumerate(event_types):
            prob = float(raw_predictions[0][i]) * 100
            predictions.append(EventProbability(
                event_type=event_type,
                probability=round(prob, 2),
                risk_level=get_risk_level(prob)
            ))
        
        return predictions
    """
    
    event_types = ["Inundación", "Deslizamiento", "Incendio", "Sismo"]
    predictions = []
    
    # Generar probabilidades aleatorias pero realistas
    # Usar semilla basada en ubicación para resultados consistentes por ubicación
    seed = hash(f"{request.provincia}{request.canton}{request.month}")
    random.seed(seed)
    
    for event_type in event_types:
        # Probabilidades ponderadas según el tipo de evento y temporada
        base_prob = random.uniform(5, 85)
        
        # Ajustes por temporada (simplificado)
        if event_type == "Inundación" and request.month in [1, 2, 3, 4]:
            base_prob *= 1.3  # Más probable en época lluviosa
        elif event_type == "Incendio" and request.month in [7, 8, 9, 10]:
            base_prob *= 1.3  # Más probable en época seca
        
        probability = min(round(base_prob, 2), 100.0)
        
        predictions.append(EventProbability(
            event_type=event_type,
            probability=probability,
            risk_level=get_risk_level(probability)
        ))
    
    # Resetear la semilla para otros usos aleatorios
    random.seed()
    
    return predictions


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check():
    """Endpoint de health check"""
    return {
        "status": "healthy",
        "service": "ai-service",
        "model_loaded": MODEL_LOADED,
        "mode": "mock" if not MODEL_LOADED else "production",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Genera predicciones de eventos catastróficos para una ubicación y fecha específicas.
    
    Actualmente funciona en modo MOCK. Cuando el modelo esté entrenado,
    esta función utilizará el modelo .keras/.h5 real.
    """
    try:
        # AQUÍ SE CARGARÁ EL MODELO .KERAS EN EL FUTURO Y SE REEMPLAZARÁ ESTA LÓGICA MOCK
        # 
        # Verificación futura:
        # if model is None:
        #     raise HTTPException(status_code=503, detail="Modelo no disponible")
        
        # Generar predicciones (mock por ahora)
        predictions = generate_mock_predictions(request)
        
        # Construir respuesta
        response = PredictionResponse(
            success=True,
            timestamp=datetime.now().isoformat(),
            location={
                "provincia": request.provincia,
                "canton": request.canton,
                "coordinates": {
                    "lat": request.latitude,
                    "lng": request.longitude
                }
            },
            predictions=predictions,
            model_version="mock-v1.0.0",  # Cambiar a versión real cuando esté el modelo
            is_mock=True  # Cambiar a False cuando se use el modelo real
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en predicción: {str(e)}")


@app.get("/")
async def root():
    """Endpoint raíz con información del servicio"""
    return {
        "service": "AI Service - Predicción de Eventos Catastróficos",
        "version": "1.0.0",
        "status": "running",
        "mode": "mock" if not MODEL_LOADED else "production",
        "endpoints": {
            "predict": "POST /predict",
            "health": "GET /health",
            "docs": "GET /docs"
        }
    }


# ============================================================================
# EJECUCIÓN LOCAL (para desarrollo sin Docker)
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
