package main

import (
    "database/sql"
    "encoding/json" 
    "log"
    "net/http"
    "os"
    
    "github.com/golang-jwt/jwt/v5"
    "github.com/joho/godotenv"
    _ "github.com/lib/pq"

    "urpaint/internal/handlers"
    "urpaint/internal/middleware"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET not set")
	}

	connStr := "postgres://" + dbUser + ":" + dbPassword + "@" + dbHost + ":" + dbPort + "/" + dbName + "?sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("DB open error:", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatal("DB ping error:", err)
	}
	defer db.Close()
	log.Println("Connected to PostgreSQL")

	authHandler := &handlers.AuthHandler{
		DB:        db,
		JWTSecret: []byte(jwtSecret),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/signup", authHandler.Signup)
	mux.HandleFunc("/login", authHandler.Login)

	// Protected profile route
	mux.Handle("/profile", middleware.JWTAuth([]byte(jwtSecret), http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value("claims").(jwt.MapClaims)
		if !ok {
			http.Error(w, "Claims not found", http.StatusUnauthorized)
			return
		}

		profile := map[string]string{
			"email": claims["email"].(string),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profile)
	})))

	// Wrap with CORS
	handler := withCORS(mux)

	log.Println("Server running on port 8080")
	http.ListenAndServe(":8080", handler)
}

// CORS wrapper
func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		h.ServeHTTP(w, r)
	})
}


