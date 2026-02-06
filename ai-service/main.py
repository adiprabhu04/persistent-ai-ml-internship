from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image
import io

app = FastAPI(title="Notely OCR Service (Lite)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "healthy", "model": "Tesseract OCR"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    try:

        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        text = pytesseract.image_to_string(image)

        return {
            "success": True,
            "filename": file.filename,
            "text": text.strip()
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="OCR processing failed")

@app.post("/ocr")
async def extract_text_alias(file: UploadFile = File(...)):
    return await extract_text(file)