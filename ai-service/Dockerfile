# AI Service Dockerfile
# Python 3.11 con FastAPI

FROM python:3.11-slim

# Establecer directorio de trabajo
WORKDIR /app

# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar código fuente y modelos (Asegura que COPY . . incluya la carpeta model)
COPY . .
# Verificación visual en el build
RUN echo "Archivos de modelo copiados:" && ls -la /app/model/

# Exponer puerto
EXPOSE 8000

# --- HEALTHCHECK CORREGIDO PARA RENDER ---
# Damos 120 segundos de gracia al inicio antes de marcar como "unhealthy"
# El endpoint /health responderá "loading" pero código 200, evitando reinicios prematuros
HEALTHCHECK --interval=30s --timeout=30s --start-period=120s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1
# ------------------------------------------

# Comando para producción (sin --reload para ahorrar recursos)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]