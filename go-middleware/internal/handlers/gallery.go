package handlers

import (
	"database/sql"
    "encoding/json"
    "net/http"
    "strconv"
	"strings"

    "github.com/cloudinary/cloudinary-go/v2"
    "github.com/cloudinary/cloudinary-go/v2/api/uploader"
    "github.com/golang-jwt/jwt/v5"

)

type GalleryHandler struct {
	DB *sql.DB
	CloudinaryURL string
}

// POST Upload 
func (h *GalleryHandler) UploadDrawing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
	}

	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
	}

	userIDFloat, ok := claims["id"].(float64)
	if !ok {
		http.Error(w, "Invalid user ID in claims", http.StatusUnauthorized)
        return
	}
	userID := int(userIDFloat)

	file, _, err := r.FormFile("drawing")
	if err != nil {
		http.Error(w, "Failed to read file: "+err.Error(), http.StatusBadRequest)
        return
	}
	defer file.Close()

	cld, err := cloudinary.NewFromURL(h.CloudinaryURL)
	if err != nil {
        http.Error(w, "Cloudinary init error: "+err.Error(), http.StatusInternalServerError)
        return
    }

	folderName := "URPaint_Gallery/user_" + strconv.Itoa(userID)

	uploadParams := uploader.UploadParams{
		Folder:       folderName, //change?
        ResourceType: "image",
	}

	uploadResult, err := cld.Upload.Upload(r.Context(), file, uploadParams)
	if err != nil {
        http.Error(w, "Upload error: "+err.Error(), http.StatusInternalServerError)
        return
    }

	_, err = h.DB.Exec(
		`INSERT INTO gallery (user_id, image_url) VALUES ($1, $2)`,
        userID, uploadResult.SecureURL,
	)
	if err != nil {
        http.Error(w, "Failed to save image reference: "+err.Error(), http.StatusInternalServerError)
        return
    }

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"imageUrl": uploadResult.SecureURL,
	})
}

// GET Display
func (h *GalleryHandler) GetGallery(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

	userIDFloat, ok := claims["id"].(float64)
    if !ok {
        http.Error(w, "Invalid user ID", http.StatusUnauthorized)
        return
    }
    userID := int(userIDFloat)

	rows, err := h.DB.Query(
		"SELECT id, image_url, uploaded_at FROM gallery WHERE user_id = $1 ORDER BY uploaded_at DESC",
        userID,
	)
	if err != nil {
		http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
        return
	}
	defer rows.Close()

	var gallery []map[string]interface{}
	for rows.Next() {
		var id int
        var url string
        var uploadedAt string
		if err := rows.Scan(&id, &url, &uploadedAt); err != nil {
            continue
        }
		gallery = append(gallery, map[string]interface{}{
			"id":         id,
            "url":        url,
            "uploadedAt": uploadedAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(gallery)
}

// PATCH Rename Image
func (h *GalleryHandler) RenameDrawing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

	userIDFloat, ok := claims["id"].(float64)
    if !ok {
        http.Error(w, "Invalid user ID", http.StatusUnauthorized)
        return
    }
    userID := int(userIDFloat)

	idParam := r.URL.Query().Get("id")
	if idParam == "" {
        http.Error(w, "Missing drawing ID", http.StatusBadRequest)
        return
    }
	drawingID, _ := strconv.Atoi(idParam)

	var input struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

	_, err := h.DB.Exec(
		"UPDATE gallery SET title = $1 WHERE id = $2 AND user_id = $3",
        input.Title, drawingID, userID,
	)
	if err != nil {
        http.Error(w, "Failed to rename drawing: "+err.Error(), http.StatusInternalServerError)
        return
    }

	w.WriteHeader(http.StatusNoContent)
}

// DELETE Delete Image
func (h *GalleryHandler) DeleteDrawing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    claims, ok := r.Context().Value("claims").(jwt.MapClaims)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    userIDFloat, ok := claims["id"].(float64)
    if !ok {
        http.Error(w, "Invalid user ID", http.StatusUnauthorized)
        return
    }
    userID := int(userIDFloat)

	idParam := r.URL.Query().Get("id")
    if idParam == "" {
        http.Error(w, "Missing drawing ID", http.StatusBadRequest)
        return
    }
    drawingID, _ := strconv.Atoi(idParam)

	var imageURL string
	err := h.DB.QueryRow("SELECT image_url FROM gallery WHERE id = $1 AND user_id = $2", drawingID, userID).Scan(&imageURL)
	if err != nil {
        http.Error(w, "Drawing not found", http.StatusNotFound)
        return
    }

	cld, err := cloudinary.NewFromURL(h.CloudinaryURL)
    if err == nil {
        uploadIndex := strings.Index(imageURL, "/upload/")
        if uploadIndex != -1 {

            publicIDWithVersion := imageURL[uploadIndex+len("/upload/"):]

            slashIndex := strings.Index(publicIDWithVersion, "/")
            if slashIndex != -1 {
                publicIDWithVersion = publicIDWithVersion[slashIndex+1:]
            }

            dotIndex := strings.LastIndex(publicIDWithVersion, ".")
            if dotIndex != -1 {
                publicIDWithVersion = publicIDWithVersion[:dotIndex]
            }

            publicID := publicIDWithVersion

            _, destroyErr := cld.Upload.Destroy(r.Context(), uploader.DestroyParams{
                PublicID:     publicID,
                ResourceType: "image",
            })

            if destroyErr != nil {
                println("⚠️ Cloudinary delete failed:", destroyErr.Error())
            } else {
                println("✅ Cloudinary image deleted:", publicID)
            }
        }
    }

	_, err = h.DB.Exec("DELETE FROM gallery WHERE id = $1 AND user_id = $2", drawingID, userID)
    if err != nil {
        http.Error(w, "Failed to delete drawing: "+err.Error(), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}