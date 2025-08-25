package main

import (
    // "database/sql"
    // "log"
    "net/http"
    // "os"
	"fmt"

    // "github.com/joho/godotenv"
    // _ "github.com/lib/pq"
    // "urpaint/internal/handlers"
    // "urpaint/internal/middleware"
)

// func main() {
//     // Load environment variables
//     err := godotenv.Load()
//     if err != nil {
//         log.Fatal("Error loading .env file")
//     }

//     // Read environment variables
//     dbUser := os.Getenv("DB_USER")
//     dbPassword := os.Getenv("DB_PASSWORD")
//     dbName := os.Getenv("DB_NAME")
//     dbHost := os.Getenv("DB_HOST")
//     dbPort := os.Getenv("DB_PORT")
//     jwtSecret := os.Getenv("JWT_SECRET")

//     // PostgreSQL connection string
//     connStr := "postgres://" + dbUser + ":" + dbPassword + "@" + dbHost + ":" + dbPort + "/" + dbName + "?sslmode=disable"
//     db, err := sql.Open("postgres", connStr)
//     if err != nil {
//         log.Fatal(err)
//     }
//     defer db.Close()

//     // Initialize AuthHandler
//     authHandler := &handlers.AuthHandler{
//         DB:        db,
//         JWTSecret: []byte(jwtSecret),
//     }

//     // Setup routes
//     mux := http.NewServeMux()
//     mux.HandleFunc("/signup", authHandler.Signup)
//     mux.HandleFunc("/login", authHandler.Login)

//     // Protected route
//     mux.Handle("/profile", middleware.JWTAuth([]byte(jwtSecret), http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
//         w.Write([]byte("Welcome to your profile!"))
//     })))

//     log.Println("Server running on port 8080")
//     http.ListenAndServe(":8080", mux)
// }

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/signup", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "Signup route works")
    })
    mux.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "Login route works")
    })

    fmt.Println("Server running on port 8080")
	fmt.Println("THIS IS THE TEST SERVER")
    http.ListenAndServe(":8080", mux)
}


