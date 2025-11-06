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

	// PostGresQL
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

	// Cloudinary
	cloudinaryURL := os.Getenv("CLOUDINARY_URL")
	if cloudinaryURL == "" {
		log.Fatal("CLOUDINARY_URL not set")
	}
	avatarHandler := &handlers.AvatarHandler{
		DB:            db,
		CloudinaryURL: cloudinaryURL,
	}

	// Gallery
	galleryHandler := &handlers.GalleryHandler{
		DB:            db,
		CloudinaryURL: cloudinaryURL,
	}

	// Handlers
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

	// Upload Profile Avatar 
	mux.Handle("/profile/avatar", middleware.JWTAuth([]byte(jwtSecret), http.HandlerFunc(avatarHandler.UploadAvatar)))

	// Upload Drawing
	mux.Handle("/gallery/upload", middleware.JWTAuth([]byte(jwtSecret), http.HandlerFunc(galleryHandler.UploadDrawing)))

	// Get Drawing
	mux.Handle("/gallery", middleware.JWTAuth([]byte(jwtSecret), http.HandlerFunc(galleryHandler.GetGallery)))

	// Rename Drawing
	mux.Handle("/gallery/rename", middleware.JWTAuth([]byte(jwtSecret), http.HandlerFunc(galleryHandler.RenameDrawing)))

	// Delete Drawing
	mux.Handle("/gallery/delete", middleware.JWTAuth([]byte(jwtSecret), http.HandlerFunc(galleryHandler.DeleteDrawing)))

	// Rearrange Drawing
	mux.Handle("/gallery/reorder", middleware.JWTAuth([]byte(jwtSecret), http.HandlerFunc(galleryHandler.ReorderGallery)))

	// Edit Drawing
	mux.Handle("/gallery/update", middleware.JWTAuth([]byte(jwtSecret), http.HandlerFunc(galleryHandler.UpdateDrawing)))

	handler := withCORS(mux)

	log.Println("Server running on port 8080")
	http.ListenAndServe(":8080", handler)
}

// CORS wrapper
func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		h.ServeHTTP(w, r)
	})
}


