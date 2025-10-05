package main

import (
    "database/sql"
    // "encoding/json" 
    "log"
    "net/http"
    "os"
    
    // "github.com/golang-jwt/jwt/v5"
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

	profileHandler := &handlers.ProfileHandler{
		DB: db,
	}

	mux := http.NewServeMux()

	// Login and Signup
	mux.HandleFunc("/signup", authHandler.Signup)
	mux.HandleFunc("/login", authHandler.Login)

	// Return and Update Profile Information
	mux.Handle("/profile", middleware.JWTAuth([]byte(jwtSecret), http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			profileHandler.GetProfile(w, r)
		case http.MethodPatch:
			profileHandler.UpdateProfile(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	handler := withCORS(mux)

	log.Println("Server running on port 8080")
	http.ListenAndServe(":8080", handler)
}

// CORS wrapper
func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		h.ServeHTTP(w, r)
	})
}


