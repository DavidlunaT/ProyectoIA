/*
Sistema de Predicción de Eventos Catastróficos en Ecuador
Backend API Gateway - Go con Gin
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
	"strings"
	"sync"
	"time"
	"unicode"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

// ============================================================================
// CONFIGURACIÓN Y ESTRUCTURAS
// ============================================================================

var (
	aiServiceURL = getEnv("AI_SERVICE_URL", "http://ai-service:8000")
	port         = getEnv("PORT", "8080")
	// Mapa global: Provincia (NORMALIZADA) -> Canton (NORMALIZADA) -> Lista de Parroquias
	// Usamos claves normalizadas (MAYUSCULAS SIN TILDES) para buscar, pero guardamos nombres reales
	globalData = make(map[string]map[string][]ParroquiaDetail)
)

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

type ParroquiaDetail struct {
	ID   string
	Name string // Nombre original bonito (Title Case)
	Lat  float64
	Lng  float64
}

// Estructuras JSON
type JsonDivisionPolitica map[string]struct {
	Provincia string `json:"provincia"`
	Cantones  map[string]struct {
		Canton     string            `json:"canton"`
		Parroquias map[string]string `json:"parroquias"`
	} `json:"cantones"`
}

type JsonCoordsParroquia map[string]struct {
	Nombre string  `json:"nombre"`
	Lat    float64 `json:"lat"`
	Lon    float64 `json:"lon"`
}

// Estructuras API
type PredictRequest struct {
	Provincia string `json:"provincia" binding:"required"`
	Canton    string `json:"canton" binding:"required"`
	Day       int    `json:"day" binding:"required"`
	Month     int    `json:"month" binding:"required"`
}

type PredictResponse struct {
	Success     bool                          `json:"success"`
	Provincia   string                        `json:"provincia"`
	Canton      string                        `json:"canton"`
	Timestamp   string                        `json:"timestamp"`
	Parroquias  map[string]ParroquiaResult    `json:"parroquias_data"`
}

type ParroquiaResult struct {
	Lat         float64            `json:"lat"`
	Lng         float64            `json:"lng"`
	Predictions []EventProbability `json:"predictions"`
	MaxRisk     string             `json:"max_risk"`
}

type EventProbability struct {
	EventType   string  `json:"event_type"`
	Probability float64 `json:"probability"`
	RiskLevel   string  `json:"risk_level"`
}

type AIServiceRequest struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Day       int     `json:"day"`
	Month     int     `json:"month"`
	Provincia string  `json:"provincia"`
	Canton    string  `json:"canton"`
	Parroquia string  `json:"parroquia"`
}

type AIServiceResponse struct {
	Success     bool               `json:"success"`
	Predictions []EventProbability `json:"predictions"`
}

// ============================================================================
// UTILIDADES
// ============================================================================

func toTitleCase(str string) string {
	caser := cases.Title(language.Spanish)
	return caser.String(strings.ToLower(str))
}

// NormalizeKey convierte a MAYÚSCULAS y quita tildes para usar como llave de búsqueda
// Ejemplo: "San José" -> "SAN JOSE"
func NormalizeKey(str string) string {
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	s, _, _ := transform.String(t, str)
	return strings.ToUpper(s)
}

// ============================================================================
// CARGA DE DATOS
// ============================================================================

func loadDataFromJSON() error {
	log.Println("📂 Cargando base de datos de parroquias...")

	// 1. Leer Division Politica
	divFile, err := os.ReadFile("data/division_politica.json")
	if err != nil { return fmt.Errorf("error leyendo division_politica: %v", err) }
	
	var division JsonDivisionPolitica
	if err := json.Unmarshal(divFile, &division); err != nil { return err }

	// 2. Leer Coordenadas
	coordsFile, err := os.ReadFile("data/coords_parroquias.json")
	if err != nil { return fmt.Errorf("error leyendo coords_parroquias: %v", err) }
	
	var coordsMap JsonCoordsParroquia
	if err := json.Unmarshal(coordsFile, &coordsMap); err != nil { return err }

	// 3. Procesar
	countP := 0
	countC := 0
	
	// Reiniciar mapa global
	globalData = make(map[string]map[string][]ParroquiaDetail)

	for _, provData := range division {
		// Usar llave normalizada para el mapa
		provKey := NormalizeKey(provData.Provincia)
		
		if _, exists := globalData[provKey]; !exists {
			globalData[provKey] = make(map[string][]ParroquiaDetail)
		}

		for _, cantData := range provData.Cantones {
			cantKey := NormalizeKey(cantData.Canton)
			var parroquiasList []ParroquiaDetail

			for id, pNameRaw := range cantData.Parroquias {
				// Buscar coordenadas
				if coord, ok := coordsMap[id]; ok {
					// Guardamos el nombre bonito para mostrar en el frontend
					pName := toTitleCase(pNameRaw)
					parroquiasList = append(parroquiasList, ParroquiaDetail{
						ID:   id,
						Name: pName,
						Lat:  coord.Lat,
						Lng:  coord.Lon,
					})
					countP++
				}
			}
			// Solo agregamos si tiene parroquias
			if len(parroquiasList) > 0 {
				globalData[provKey][cantKey] = parroquiasList
				countC++
			}
		}
	}
	log.Printf("✅ Datos cargados: %d cantones y %d parroquias indexadas.", countC, countP)
	return nil
}

// ============================================================================
// HANDLERS
// ============================================================================

func PredictHandler(c *gin.Context) {
	var req PredictRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// 1. Normalizar las claves que vienen del request para buscar en el mapa
	provKey := NormalizeKey(req.Provincia)
	cantKey := NormalizeKey(req.Canton)

	log.Printf("🔍 Buscando: Provincia[%s] -> Canton[%s]", provKey, cantKey)

	// 2. Buscar en el mapa
	provMap, ok := globalData[provKey]
	if !ok {
		log.Printf("❌ Provincia no encontrada: %s (Key: %s)", req.Provincia, provKey)
		c.JSON(400, gin.H{"error": fmt.Sprintf("Provincia no encontrada: %s", req.Provincia)})
		return
	}
	
	parroquias, ok := provMap[cantKey]
	if !ok {
		log.Printf("❌ Cantón no encontrado: %s (Key: %s)", req.Canton, cantKey)
		// Intento de fallback: buscar si el cantón está contenido en alguna llave
		found := false
		for k, v := range provMap {
			if strings.Contains(k, cantKey) || strings.Contains(cantKey, k) {
				parroquias = v
				found = true
				log.Printf("⚠️ Match aproximado encontrado: %s", k)
				break
			}
		}
		if !found {
			c.JSON(400, gin.H{"error": fmt.Sprintf("Cantón no encontrado: %s", req.Canton)})
			return
		}
	}

	// 3. Procesar predicciones en PARALELO
	results := make(map[string]ParroquiaResult)
	var mu sync.Mutex 
	var wg sync.WaitGroup

	log.Printf("🚀 Iniciando predicción para %d parroquias...", len(parroquias))

	for _, p := range parroquias {
		wg.Add(1)
		go func(parroquia ParroquiaDetail) {
			defer wg.Done()

			aiReq := AIServiceRequest{
				Latitude:  parroquia.Lat,
				Longitude: parroquia.Lng,
				Day:       req.Day,
				Month:     req.Month,
				Provincia: req.Provincia,
				Canton:    req.Canton,
				Parroquia: parroquia.Name,
			}

			aiResp, err := callAIService(aiReq)
			
			if err == nil && aiResp.Success {
				// Calcular riesgo máximo simple
				maxRisk := "bajo"
				if len(aiResp.Predictions) > 0 {
					// Asumimos que vienen ordenados por probabilidad
					topPred := aiResp.Predictions[0]
					maxRisk = topPred.RiskLevel
				}

				mu.Lock()
				results[parroquia.Name] = ParroquiaResult{
					Lat:         parroquia.Lat,
					Lng:         parroquia.Lng,
					Predictions: aiResp.Predictions,
					MaxRisk:     maxRisk,
				}
				mu.Unlock()
			} else {
				log.Printf("⚠️ Fallo predicción para %s: %v", parroquia.Name, err)
			}
		}(p)
	}

	wg.Wait() 

	log.Printf("✅ Finalizado. %d resultados generados.", len(results))

	c.JSON(200, PredictResponse{
		Success:    true,
		Provincia:  req.Provincia,
		Canton:     req.Canton,
		Timestamp:  time.Now().Format(time.RFC3339),
		Parroquias: results,
	})
}

func callAIService(req AIServiceRequest) (*AIServiceResponse, error) {
	jsonData, _ := json.Marshal(req)
	client := &http.Client{Timeout: 10 * time.Second} // Timeout para no colgarse
	
	resp, err := client.Post(
		fmt.Sprintf("%s/predict", aiServiceURL),
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil { return nil, err }
	defer resp.Body.Close()

	if resp.StatusCode != 200 { 
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("status %d: %s", resp.StatusCode, string(bodyBytes)) 
	}

	var aiResp AIServiceResponse
	if err := json.NewDecoder(resp.Body).Decode(&aiResp); err != nil { return nil, err }
	return &aiResp, nil
}

func GetProvinciasHandler(c *gin.Context) {
	// Este endpoint es opcional si el frontend usa data estática, 
	// pero sirve para depurar qué cargó el backend
	resp := make(map[string][]string)
	for pKey, cantones := range globalData {
		// Recuperar nombre bonito es difícil desde la key normalizada,
		// devolvemos la key normalizada o requeriría guardar el nombre original en el mapa.
		// Para simplificar, devolvemos las keys (útil para debug)
		list := make([]string, 0, len(cantones))
		for cKey := range cantones { list = append(list, cKey) }
		resp[pKey] = list
	}
	c.JSON(200, gin.H{"success": true, "provincias_loaded": len(resp)})
}

func HealthHandler(c *gin.Context) {
	c.JSON(200, gin.H{"status": "ok", "backend": "go-gin"})
}

func main() {
	if err := loadDataFromJSON(); err != nil {
		log.Fatalf("❌ Error cargando datos: %v", err)
	}

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	r.Use(cors.Default())
	
	r.GET("/api/health", HealthHandler)
	r.GET("/api/provincias", GetProvinciasHandler)
	r.POST("/api/predict", PredictHandler)

	log.Printf("🚀 Backend corriendo en puerto %s", port)
	r.Run(":" + port)
}