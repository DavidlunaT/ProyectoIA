# Sistema de Predicción de Eventos Catastróficos en Ecuador

Proyecto académico basado en una arquitectura de microservicios para la
predicción de eventos catastróficos en Ecuador.

## Arquitectura

Frontend (React) → Backend (Go) → AI Service (FastAPI)

Cada servicio corre en su propio contenedor Docker y se comunica vía HTTP.

## Stack

- Frontend: React + Vite (Nginx)
- Backend: Go (Gin)
- AI Service: Python + FastAPI + Keras
- Infraestructura: Docker / Docker Compose

## Requisitos

- Docker Desktop instalado y corriendo
- Docker Compose v2+

## Ejecución Local

```bash
docker compose up --build
```

## Acceso a los Servicios

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | Interfaz web principal |
| Backend API | http://localhost:8080 | API Gateway (Go) |
| AI Service | http://localhost:8000 | Servicio de IA (Mock) |
| AI Docs | http://localhost:8000/docs | Documentación Swagger |