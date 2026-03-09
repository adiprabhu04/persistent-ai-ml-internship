from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import vision
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import torch
import pytesseract
from PIL import Image, ImageEnhance
import io
import os

app = FastAPI(title="Notely OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check if Google credentials are available
GOOGLE_CREDENTIALS_PRESENT = bool(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))

# Load TrOCR model at startup (once)
print("Loading TrOCR model...")
trocr_processor = TrOCRProcessor.from_pretrained('microsoft/trocr-base-handwritten')
trocr_model = VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-base-handwritten')
print("TrOCR model loaded successfully")

PSM_MODES = {
    "auto": 3,
    "document": 6,
    "screenshot": 6,
    "photo": 11,
    "sparse": 11,
}


def extract_text_with_trocr(image: Image.Image) -> dict:
    """Extract text using Microsoft TrOCR (optimized for handwriting)."""
    try:
        if image.mode != 'RGB':
            image = image.convert('RGB')

        pixel_values = trocr_processor(images=image, return_tensors="pt").pixel_values
        generated_ids = trocr_model.generate(pixel_values)
        text = trocr_processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

        confidence = 0.85 if len(text.strip()) > 0 else 0.0

        return {
            "text": text.strip(),
            "confidence": confidence,
            "engine": "trocr"
        }
    except Exception as e:
        print(f"TrOCR error: {str(e)}")
        return None


def preprocess_image(image: Image.Image, image_type: str = "auto") -> Image.Image:
    if image.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", image.size, (255, 255, 255))
        rgba = image.convert("RGBA")
        background.paste(rgba, mask=rgba.split()[3])
        image = background
    elif image.mode != "RGB":
        image = image.convert("RGB")

    image = image.convert("L")

    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(1.2)

    return image


def get_tesseract_config(image_type: str = "auto") -> str:
    psm = PSM_MODES.get(image_type, PSM_MODES["auto"])
    return f"--oem 3 --psm {psm}"


@app.get("/")
def health_check():
    return {"status": "healthy", "model": "TrOCR + Google Cloud Vision OCR"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    image_type: str = Query(default="auto"),
    lang: str = Query(default="eng"),
    source: str = Query(default="upload"),  # "canvas" or "upload"
):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # Flatten transparency to white background
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = background

        result = None

        if source == "canvas":
            print("Using TrOCR for canvas drawing (handwriting)")
            result = extract_text_with_trocr(image)
        else:
            print("Trying TrOCR for uploaded image")
            result = extract_text_with_trocr(image)

            if result and len(result.get("text", "").strip()) < 3:
                print("TrOCR result too short, trying Google Vision")
                result = None

        # Fallback to Google Vision API
        if not result and GOOGLE_CREDENTIALS_PRESENT:
            print("Using Google Vision API")
            try:
                vision_client = vision.ImageAnnotatorClient()

                img_byte_arr = io.BytesIO()
                image.save(img_byte_arr, format='PNG')
                content = img_byte_arr.getvalue()

                vision_image = vision.Image(content=content)
                response = vision_client.document_text_detection(
                    image=vision_image,
                    image_context={"language_hints": ["en"]}
                )

                if response.text_annotations:
                    text = response.text_annotations[0].description
                    result = {
                        "text": text.strip(),
                        "confidence": 0.80,
                        "engine": "google_vision"
                    }
            except Exception as e:
                print(f"Google Vision error: {str(e)}")

        # Final fallback to Tesseract
        if not result:
            print("Using Tesseract fallback")
            processed = preprocess_image(image, image_type)
            config = get_tesseract_config(image_type)
            text = pytesseract.image_to_string(processed, lang=lang, config=config)
            result = {
                "text": text.strip(),
                "confidence": None,
                "engine": "tesseract"
            }

        return {
            "success": True,
            "filename": file.filename,
            "text": result["text"],
            "engine": result.get("engine"),
            "confidence": result.get("confidence"),
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="OCR processing failed")
