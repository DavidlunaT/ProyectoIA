# Sistema de Predicción de Eventos Catastróficos en Ecuador

Sistema basado en microservicios para predecir eventos catastróficos (inundaciones, deslizamientos, incendios, sismos) en Ecuador.

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    Backend      │────▶│   AI Service    │
│  (React/Vite)   │     │   (Go/Gin)      │     │  (Python/Fast)  │
│    :3000        │     │    :8080        │     │    :8000        │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │                 │
                        │   Firestore     │
                        │  (Logs/Data)    │
                        │                 │
                        └─────────────────┘
```

## Stack Tecnológico

- **Frontend**: React (Vite) + TailwindCSS + Recharts
- **Backend**: Go (Golang) con Gin
- **AI Service**: Python 3.11 con FastAPI
- **Base de Datos**: Firebase Firestore
- **Infraestructura**: Docker & Docker Compose

## Requisitos Previos

- Docker Desktop instalado y corriendo
- Docker Compose v2+

## Inicio Rápido

```bash
# Clonar/navegar al proyecto
cd ProyectoIA

# Levantar todos los servicios
docker-compose up --build

# O en segundo plano
docker-compose up --build -d
```

## Acceso a los Servicios

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | Interfaz web principal |
| Backend API | http://localhost:8080 | API Gateway (Go) |
| AI Service | http://localhost:8000 | Servicio de IA (Mock) |
| AI Docs | http://localhost:8000/docs | Documentación Swagger |

## Estructura del Proyecto

```
ProyectoIA/
├── frontend/              # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── data/          # Datos estáticos (provincias/cantones)
│   │   └── ...
│   ├── Dockerfile
│   └── package.json
│
├── backend/               # Go + Gin
│   ├── main.go
│   ├── Dockerfile
│   └── go.mod
│
├── ai-service/            # Python + FastAPI
│   ├── app/
│   │   └── main.py
│   ├── model/             # ← Aquí irán los modelos .keras/.h5
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml
└── README.md
```

## Integración del Modelo de IA

Cuando tengas el modelo entrenado:

1. Coloca los archivos `.keras` o `.h5` en `ai-service/model/`
2. Modifica `ai-service/app/main.py` en la sección marcada con:
   `# AQUÍ SE CARGARÁ EL MODELO .KERAS EN EL FUTURO`
3. Reconstruye el contenedor: `docker-compose up --build ai-service`

## Endpoints API

### Backend (Go) - Puerto 8080

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/predict` | Solicitar predicción de eventos |
| GET | `/api/health` | Health check |

### AI Service (Python) - Puerto 8000

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/predict` | Generar predicción (mock/real) |
| GET | `/health` | Health check |

## Desarrollo

Para desarrollo con hot-reload:

```bash
docker-compose up
```

Los cambios en el código se reflejarán automáticamente gracias a los volúmenes montados.

## Licencia

MIT License - Universidad del Ecuador
