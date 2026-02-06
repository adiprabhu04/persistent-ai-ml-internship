from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import easyocr
import shutil
import os
import uuid
from PIL import Image
import io

app = FastAPI(
    title="Notely OCR Service",
    description="AI-powered handwriting recognition using EasyOCR",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'}
MAX_FILE_SIZE = 10 * 1024 * 1024

print("Loading AI Model... (This may take a minute)")
reader = easyocr.Reader(['en'], gpu=False)
print("Model Loaded and Ready!")


@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "Notely OCR",
        "model": "EasyOCR",
        "languages": ["en"]
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


def preprocess_image(image_path: str) -> str:
    try:
        with Image.open(image_path) as img:
            if img.mode != 'RGB':
                img = img.convert('RGB')

            max_dimension = 2000
            if max(img.size) > max_dimension:
                ratio = max_dimension / max(img.size)
                new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)

            processed_path = f"processed_{os.path.basename(image_path)}"
            img.save(processed_path, 'PNG', optimize=True)
            return processed_path
    except Exception:
        return image_path


@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    temp_filename = f"temp_{uuid.uuid4().hex}{file_ext}"
    processed_filename = None

    try:
        with open(temp_filename, "wb") as buffer:
            buffer.write(content)

        processed_filename = preprocess_image(temp_filename)

        result = reader.readtext(processed_filename, detail=0, paragraph=True)

        full_text = "\n".join(result) if result else ""

        return {
            "success": True,
            "filename": file.filename,
            "text": full_text,
            "word_count": len(full_text.split()) if full_text else 0
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to process image. Please try with a clearer image."
        )

    finally:
        for path in [temp_filename, processed_filename]:
            if path and os.path.exists(path) and path != temp_filename:
                try:
                    os.remove(path)
                except Exception:
                    pass
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except Exception:
                pass


@app.post("/extract-text")
async def extract_text_legacy(file: UploadFile = File(...)):
    return await extract_text(file)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "An unexpected error occurred"}
    )
