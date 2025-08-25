package middleware

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

func JWTAuth(secret []byte, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
            http.Error(w, "Missing or invalid Authorization header", http.StatusUnauthorized)
            return
        }

        tokenString := strings.TrimPrefix(authHeader, "Bearer ")

        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, jwt.ErrSignatureInvalid
            }
            return secret, nil
        })

        if err != nil || !token.Valid {
            http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
            return
        }

        next.ServeHTTP(w, r)
    })
}
