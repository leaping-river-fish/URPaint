package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"urpaint/internal/models"
)

type AuthHandler struct {
	DB *sql.DB
	JWTSecret []byte
}

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	_, err = h.DB.Exec("INSERT INTO users (email, password) VALUES ($1, $2)", user.Email, string(hashedPassword))
	if err != nil {
		http.Error(w, "Error saving user", http.StatusInternalServerError)
        return
	}

	w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]string{"message": "User created successfully"})
}


func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

	var hashedPassword string
	err := h.DB.QueryRow("SELECT password FROM users WHERE email=$1", user.Email).Scan(&hashedPassword)
    if err != nil {
        http.Error(w, "Invalid email or password", http.StatusUnauthorized)
        return
    }

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(user.Password)); err != nil {
        http.Error(w, "Invalid email or password", http.StatusUnauthorized)
        return
    }

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email": user.Email,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(h.JWTSecret)
	if err != nil {
        http.Error(w, "Error generating token", http.StatusInternalServerError)
        return
    }

	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}