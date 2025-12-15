# Backend Dockerfile
# Go con Gin Framework

# Etapa de construcción
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache git

# Copiar go.mod
COPY go.mod ./

# Descargar dependencias y generar go.sum
RUN go mod download && go mod tidy

# Copiar código fuente
COPY . .

# Compilar la aplicación
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Etapa de desarrollo (con hot-reload usando air)
FROM golang:1.23-alpine AS development

WORKDIR /app

# Instalar air para hot-reload (versión específica compatible)
RUN go install github.com/air-verse/air@v1.52.3

# Instalar dependencias del sistema
RUN apk add --no-cache git curl

# Crear directorio tmp para air
RUN mkdir -p /app/tmp

# Copiar go.mod primero
COPY go.mod ./

# Descargar dependencias
RUN go mod download

# Copiar el resto del código
COPY . .

# Generar go.sum
RUN go mod tidy

# Script de inicio que regenera go.sum si es necesario
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /app' >> /start.sh && \
    echo 'if [ ! -f go.sum ] || [ ! -s go.sum ]; then' >> /start.sh && \
    echo '  echo "Generando go.sum..."' >> /start.sh && \
    echo '  go mod download' >> /start.sh && \
    echo '  go mod tidy' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    echo 'exec air' >> /start.sh && \
    chmod +x /start.sh

# Exponer puerto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Comando para desarrollo con hot-reload (usa script que regenera go.sum)
CMD ["/start.sh"]

# Etapa de producción
FROM alpine:latest AS production

WORKDIR /app

# Instalar certificados CA
RUN apk --no-cache add ca-certificates curl

# Copiar binario desde builder
COPY --from=builder /app/main .

# Exponer puerto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Comando para ejecutar
CMD ["./main"]
