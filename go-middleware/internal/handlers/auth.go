package handlers

import (
    "database/sql"
	"encoding/json"
    "net/http"
    "time"
    "strings"

    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/crypto/bcrypt"
    "github.com/lib/pq"
)

type AuthHandler struct {
    DB *sql.DB
	JWTSecret []byte
}

type Credentials struct {
	Email string `json:"email"`
	Password string `json:"password"`
}

type User struct {
    ID    int
    Email string
    Hash  string
}

type ProfileHandler struct {
    DB *sql.DB
}

// GET /profile

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
    claims, ok := r.Context().Value("claims").(jwt.MapClaims)
    if !ok {
        http.Error(w, "Claims not found", http.StatusUnauthorized)
        return
    }

    userIDFloat, ok := claims["id"].(float64)
    if !ok {
        http.Error(w, "Invalid user ID in claims", http.StatusUnauthorized)
        return
    }
    userID := int(userIDFloat)

    var profile struct {
        ID       int    `json:"id"`
        Email    string `json:"email"`
        Bio      string `json:"bio"`
        JoinedAt string `json:"joinedAt"`
    }

    var bio sql.NullString
    var createdAt sql.NullTime

    err := h.DB.QueryRow(
        "SELECT id, email, bio, created_at FROM users WHERE id = $1",
        userID,
    ).Scan(&profile.ID, &profile.Email, &bio, &createdAt)
    
    if err != nil {
        if err == sql.ErrNoRows {
            http.Error(w, "User not found", http.StatusNotFound)
            return
        }

        http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    // Conversion from DB
    if bio.Valid {
        profile.Bio = bio.String
    } else {
        profile.Bio = ""
    }

    if createdAt.Valid {
        profile.JoinedAt = createdAt.Time.Format(time.RFC3339)
    } else {
        profile.JoinedAt = ""
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(profile)
}

// PATCH /profile
func(h *ProfileHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPatch {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    claims, ok := r.Context().Value("claims").(jwt.MapClaims)
    if !ok {
        http.Error(w, "Claims not found", http.StatusUnauthorized)
        return
    }

    userIDFloat, ok := claims["id"].(float64)
    if !ok {
        http.Error(w, "Invalid user ID in claims", http.StatusUnauthorized)
        return
    }

    userID := int(userIDFloat)

    var input struct {
        Bio string `json:"bio"`
    }
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    _, err := h.DB.Exec(
        "UPDATE users SET bio = $1 WHERE id = $2",
        input.Bio, userID,
    )
    if err != nil {
        http.Error(w, "Failed to update profile: "+err.Error(), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

// signup

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var creds Credentials
    if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    if creds.Email == "" || creds.Password == "" {
        http.Error(w, "Email and password required", http.StatusBadRequest)
        return
    }

    hashed, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
    if err != nil {
        http.Error(w, "Error hashing password", http.StatusInternalServerError)
        return
    }

    _, err = h.DB.Exec(
        "INSERT INTO users (email, password) Values ($1, $2)",
        creds.Email, string(hashed),
    )

    if err != nil {
        
        if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
            http.Error(w, "Email already exists", http.StatusConflict)
            return
        }

        
        if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
            http.Error(w, "Email already exists", http.StatusConflict)
            return
        }

        http.Error(w, "Failed to create user: "+err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]string{"message": "User created"})
}

// login

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var creds Credentials
    if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    var user User
    var storedHash string
    err := h.DB.QueryRow("SELECT id, email, password FROM users WHERE email = $1", creds.Email).
        Scan(&user.ID, &user.Email, &storedHash)
    if err != nil {
        http.Error(w, "Invalid credentials", http.StatusUnauthorized)
        return
    }

    if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(creds.Password)); err != nil {
        http.Error(w, "Invalid credentials", http.StatusUnauthorized)
        return
    }

    // Create JWT
    claims := jwt.MapClaims{
        "id":    user.ID,
        "email": user.Email,
        "exp":   time.Now().Add(24 * time.Hour).Unix(),
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    signed, err := token.SignedString(h.JWTSecret)
    if err != nil {
        http.Error(w, "Could not generate token", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"token": signed})
}



