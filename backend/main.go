/*
Sistema de Predicción de Eventos Catastróficos en Ecuador
Backend API Gateway - Go con Gin

Este servicio actúa como API Gateway, recibiendo peticiones del frontend,
validando datos, y comunicándose con el servicio de IA.
*/

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

var (
	// URL del servicio de IA (configurable por variable de entorno)
	aiServiceURL = getEnv("AI_SERVICE_URL", "http://ai-service:8000")
	port         = getEnv("PORT", "8080")
)

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// ============================================================================
// MODELOS DE DATOS
// ============================================================================

// PredictRequest representa la petición de predicción desde el frontend
type PredictRequest struct {
	Provincia string `json:"provincia" binding:"required"`
	Canton    string `json:"canton" binding:"required"`
	Day       int    `json:"day" binding:"required,min=1,max=31"`
	Month     int    `json:"month" binding:"required,min=1,max=12"`
}

// AIServiceRequest representa la petición al servicio de IA
type AIServiceRequest struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Day       int     `json:"day"`
	Month     int     `json:"month"`
	Provincia string  `json:"provincia"`
	Canton    string  `json:"canton"`
}

// EventProbability representa la probabilidad de un evento
type EventProbability struct {
	EventType   string  `json:"event_type"`
	Probability float64 `json:"probability"`
	RiskLevel   string  `json:"risk_level"`
}

// Location representa la ubicación
type Location struct {
	Provincia   string      `json:"provincia"`
	Canton      string      `json:"canton"`
	Coordinates Coordinates `json:"coordinates"`
}

// Coordinates representa las coordenadas geográficas
type Coordinates struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

// AIServiceResponse representa la respuesta del servicio de IA
type AIServiceResponse struct {
	Success      bool               `json:"success"`
	Timestamp    string             `json:"timestamp"`
	Location     Location           `json:"location"`
	Predictions  []EventProbability `json:"predictions"`
	ModelVersion string             `json:"model_version"`
	IsMock       bool               `json:"is_mock"`
}

// PredictResponse representa la respuesta al frontend
type PredictResponse struct {
	Success      bool               `json:"success"`
	Timestamp    string             `json:"timestamp"`
	Location     Location           `json:"location"`
	Predictions  []EventProbability `json:"predictions"`
	ModelVersion string             `json:"model_version"`
	IsMock       bool               `json:"is_mock"`
	RequestID    string             `json:"request_id"`
}

// QueryLog estructura para logging de consultas (preparado para Firestore)
type QueryLog struct {
	RequestID    string    `json:"request_id"`
	Timestamp    time.Time `json:"timestamp"`
	Provincia    string    `json:"provincia"`
	Canton       string    `json:"canton"`
	Day          int       `json:"day"`
	Month        int       `json:"month"`
	Success      bool      `json:"success"`
	ResponseTime float64   `json:"response_time_ms"`
}

// ============================================================================
// DATOS DE PROVINCIAS Y COORDENADAS
// ============================================================================

// Coordenadas aproximadas de las provincias de Ecuador
var provinciaCoordinates = map[string]map[string]Coordinates{
	"Guayas": {
		"Guayaquil":      {Lat: -2.1894, Lng: -79.8891},
		"Durán":          {Lat: -2.1678, Lng: -79.8311},
		"Samborondón":    {Lat: -1.9633, Lng: -79.7239},
		"Daule":          {Lat: -1.8614, Lng: -79.9781},
		"Milagro":        {Lat: -2.1347, Lng: -79.5872},
	},
	"Pichincha": {
		"Quito":           {Lat: -0.1807, Lng: -78.4678},
		"Cayambe":         {Lat: 0.0389, Lng: -78.1422},
		"Rumiñahui":       {Lat: -0.3128, Lng: -78.4428},
		"Mejía":           {Lat: -0.5167, Lng: -78.5500},
		"Pedro Moncayo":   {Lat: 0.0833, Lng: -78.2667},
	},
	"Azuay": {
		"Cuenca":         {Lat: -2.9001, Lng: -79.0059},
		"Gualaceo":       {Lat: -2.8833, Lng: -78.7833},
		"Paute":          {Lat: -2.7833, Lng: -78.7500},
		"Sigsig":         {Lat: -3.0500, Lng: -78.7833},
		"Girón":          {Lat: -3.1500, Lng: -79.1333},
	},
	"Manabí": {
		"Portoviejo":     {Lat: -1.0544, Lng: -80.4522},
		"Manta":          {Lat: -0.9537, Lng: -80.7333},
		"Chone":          {Lat: -0.6961, Lng: -80.0967},
		"Jipijapa":       {Lat: -1.3500, Lng: -80.5833},
		"Montecristi":    {Lat: -1.0472, Lng: -80.6617},
	},
}

// ============================================================================
// VALIDACIÓN
// ============================================================================

// ValidateProvinciaCantonCombo valida que el cantón pertenezca a la provincia
func ValidateProvinciaCantonCombo(provincia, canton string) bool {
	cantones, exists := provinciaCoordinates[provincia]
	if !exists {
		return false
	}
	_, cantonExists := cantones[canton]
	return cantonExists
}

// GetCoordinates obtiene las coordenadas para una provincia y cantón
func GetCoordinates(provincia, canton string) (Coordinates, error) {
	cantones, exists := provinciaCoordinates[provincia]
	if !exists {
		return Coordinates{}, fmt.Errorf("provincia no encontrada: %s", provincia)
	}
	coords, cantonExists := cantones[canton]
	if !cantonExists {
		return Coordinates{}, fmt.Errorf("cantón no encontrado: %s en %s", canton, provincia)
	}
	return coords, nil
}

// ============================================================================
// HANDLERS
// ============================================================================

// HealthHandler maneja el endpoint de health check
func HealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"service":   "backend-api",
		"timestamp": time.Now().Format(time.RFC3339),
		"ai_service_url": aiServiceURL,
	})
}

// PredictHandler maneja las peticiones de predicción
func PredictHandler(c *gin.Context) {
	startTime := time.Now()
	requestID := fmt.Sprintf("req_%d", time.Now().UnixNano())

	// Parsear el body de la petición
	var req PredictRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Datos de entrada inválidos",
			"details": err.Error(),
		})
		return
	}

	// Validar combinación provincia-cantón
	if !ValidateProvinciaCantonCombo(req.Provincia, req.Canton) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   fmt.Sprintf("Combinación inválida: el cantón '%s' no pertenece a la provincia '%s'", req.Canton, req.Provincia),
		})
		return
	}

	// Obtener coordenadas
	coords, err := GetCoordinates(req.Provincia, req.Canton)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Preparar petición al servicio de IA
	aiRequest := AIServiceRequest{
		Latitude:  coords.Lat,
		Longitude: coords.Lng,
		Day:       req.Day,
		Month:     req.Month,
		Provincia: req.Provincia,
		Canton:    req.Canton,
	}

	// Llamar al servicio de IA
	aiResponse, err := callAIService(aiRequest)
	if err != nil {
		log.Printf("Error llamando al servicio de IA: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Error al procesar la predicción",
			"details": err.Error(),
		})
		return
	}

	// Calcular tiempo de respuesta
	responseTime := float64(time.Since(startTime).Milliseconds())

	// Log de la consulta (estructura preparada para Firestore)
	queryLog := QueryLog{
		RequestID:    requestID,
		Timestamp:    time.Now(),
		Provincia:    req.Provincia,
		Canton:       req.Canton,
		Day:          req.Day,
		Month:        req.Month,
		Success:      aiResponse.Success,
		ResponseTime: responseTime,
	}
	
	// TODO: Guardar en Firestore cuando esté configurado
	// Ejemplo futuro:
	// firestoreClient.Collection("query_logs").Doc(requestID).Set(ctx, queryLog)
	log.Printf("Query Log: %+v", queryLog)

	// Preparar y enviar respuesta
	response := PredictResponse{
		Success:      aiResponse.Success,
		Timestamp:    aiResponse.Timestamp,
		Location:     aiResponse.Location,
		Predictions:  aiResponse.Predictions,
		ModelVersion: aiResponse.ModelVersion,
		IsMock:       aiResponse.IsMock,
		RequestID:    requestID,
	}

	c.JSON(http.StatusOK, response)
}

// callAIService hace la petición HTTP al servicio de IA
func callAIService(request AIServiceRequest) (*AIServiceResponse, error) {
	// Serializar la petición
	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("error serializando petición: %w", err)
	}

	// Crear la petición HTTP
	url := fmt.Sprintf("%s/predict", aiServiceURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("error creando petición: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// Ejecutar la petición con timeout
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error ejecutando petición: %w", err)
	}
	defer resp.Body.Close()

	// Leer el body de la respuesta
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error leyendo respuesta: %w", err)
	}

	// Verificar código de estado
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("servicio de IA retornó error %d: %s", resp.StatusCode, string(body))
	}

	// Deserializar la respuesta
	var aiResponse AIServiceResponse
	if err := json.Unmarshal(body, &aiResponse); err != nil {
		return nil, fmt.Errorf("error deserializando respuesta: %w", err)
	}

	return &aiResponse, nil
}

// GetProvinciasHandler devuelve la lista de provincias y cantones disponibles
func GetProvinciasHandler(c *gin.Context) {
	provincias := make(map[string][]string)
	
	for provincia, cantones := range provinciaCoordinates {
		cantonList := make([]string, 0, len(cantones))
		for canton := range cantones {
			cantonList = append(cantonList, canton)
		}
		provincias[provincia] = cantonList
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"provincias": provincias,
	})
}

// ============================================================================
// MAIN
// ============================================================================

func main() {
	// Configurar modo de Gin
	gin.SetMode(gin.ReleaseMode)
	if os.Getenv("GIN_MODE") == "debug" {
		gin.SetMode(gin.DebugMode)
	}

	// Crear router
	r := gin.Default()

	// Configurar CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Middleware de logging
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// Rutas
	r.GET("/health", HealthHandler)
	r.GET("/api/health", HealthHandler)
	r.GET("/api/provincias", GetProvinciasHandler)
	r.POST("/api/predict", PredictHandler)

	// Ruta raíz
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "Backend API - Sistema de Predicción de Eventos Catastróficos",
			"version": "1.0.0",
			"endpoints": gin.H{
				"health":     "GET /api/health",
				"provincias": "GET /api/provincias",
				"predict":    "POST /api/predict",
			},
		})
	})

	// Iniciar servidor
	log.Printf("🚀 Backend API iniciando en puerto %s", port)
	log.Printf("📡 AI Service URL: %s", aiServiceURL)
	
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Error iniciando servidor: %v", err)
	}
}
