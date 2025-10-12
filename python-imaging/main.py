from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import cv2
import numpy as np
import tempfile
from image_utils.URPaint import convert_to_coloring_page

app = FastAPI()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

@app.post("/convert")
async def convert_image(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded.")
    
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG and PNG are allowed.")

    try:
        # Read the uploaded image
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Max size is 5 MB.")

        npimg = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        # Process image
        coloring_page = convert_to_coloring_page(image)

        # Save temporary file
        temp_file = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        cv2.imwrite(temp_file.name, coloring_page)
        temp_file.close()

        response = FileResponse(temp_file.name, media_type="image/png")
        response.background = BackgroundTasks(lambda: os.remove(temp_file.name))
        return response
    
    except Exception as e:
        # Log the error for debugging
        print("Error processing image:", e)
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # add origins where neeeded
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) # change port if necessary