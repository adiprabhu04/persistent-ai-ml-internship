from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import vision
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import io
import os
import json
import tempfile
import gc

app = FastAPI(title="Notely OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check if Google credentials are available
GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
GOOGLE_CREDENTIALS_PRESENT = False

if GOOGLE_CREDENTIALS_JSON:
    try:
        creds_dict = json.loads(GOOGLE_CREDENTIALS_JSON)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(creds_dict, f)
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = f.name
        GOOGLE_CREDENTIALS_PRESENT = True
        print("Google credentials loaded from environment variable")
    except Exception as e:
        print(f"Failed to load Google credentials: {e}")
elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
    GOOGLE_CREDENTIALS_PRESENT = True
    print("Google credentials loaded from file path")
else:
    print("No Google credentials found, will use Tesseract fallback")

PSM_MODES = {
    "auto": 3,
    "document": 6,
    "screenshot": 6,
    "photo": 11,
    "sparse": 11,
}


def preprocess_image(image: Image.Image, source: str = "upload") -> Image.Image:
    """Enhanced preprocessing for better OCR accuracy"""

    # 1. Handle transparency (composite on white)
    if image.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
        image = background

    # 2. Convert to grayscale
    if image.mode != 'L':
        image = image.convert('L')

    # 3. Upscaling — smarter minimum size for canvas to improve thin stroke visibility
    if source == "canvas":
        current_max = max(image.width, image.height)
        if current_max < 1500:
            scale = 1500 / current_max
            new_size = (int(image.width * scale), int(image.height * scale))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
    else:
        if image.width < 800:
            scale = min(2.0, 800 / image.width)
            new_size = (int(image.width * scale), int(image.height * scale))
            image = image.resize(new_size, Image.Resampling.LANCZOS)

    # 4. For canvas: thicken thin pen strokes before contrast boost
    if source == "canvas":
        image = image.filter(ImageFilter.MaxFilter(size=3))
    else:
        # Denoise (reduce pencil texture, paper grain) — skip for canvas to preserve strokes
        image = image.filter(ImageFilter.MedianFilter(size=3))

    # 5. Contrast boost — stronger for canvas handwriting
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(3.0 if source == "canvas" else 2.0)

    # 6. Sharpen edges
    image = image.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))

    # 7. Normalize brightness
    enhancer = ImageEnhance.Brightness(image)
    image = enhancer.enhance(1.1)

    # 8. Thresholding for canvas drawings — Otsu-style using mean
    if source == "canvas":
        img_array = np.array(image, dtype=np.uint8)
        threshold = int(img_array.mean() * 0.8)
        binary = img_array < threshold  # dark pixels = ink
        result = np.where(binary, 0, 255).astype(np.uint8)
        image = Image.fromarray(result)
        del img_array, binary, result
        gc.collect()

    gc.collect()
    return image


def run_google_vision(client: vision.ImageAnnotatorClient, image_bytes: bytes) -> dict | None:
    """Run Vision OCR with document_text_detection, falling back to text_detection if empty."""
    try:
        vision_image = vision.Image(content=image_bytes)

        response = client.document_text_detection(
            image=vision_image,
            image_context={"language_hints": ["en"]}
        )

        # Fallback: if document_text_detection returns nothing, try text_detection
        if not response.text_annotations:
            response = client.text_detection(
                image=vision_image,
                image_context={"language_hints": ["en"]}
            )

        if not response.text_annotations:
            return None

        full_text = response.text_annotations[0].description
        words = []

        try:
            for page in response.full_text_annotation.pages:
                for block in page.blocks:
                    for paragraph in block.paragraphs:
                        for word in paragraph.words:
                            word_text = ''.join([symbol.text for symbol in word.symbols])
                            word_conf = word.confidence if hasattr(word, 'confidence') and word.confidence else 0.9
                            words.append({
                                "text": word_text,
                                "confidence": round(word_conf * 100, 1)
                            })
        except Exception:
            pass

        avg_confidence = sum(w["confidence"] for w in words) / len(words) if words else 85.0
        return {
            "text": full_text.strip(),
            "confidence": round(avg_confidence, 1),
            "words": words,
            "engine": "google_vision"
        }
    except Exception as e:
        print(f"Google Vision error: {str(e)}")
        return None


def get_tesseract_config(image_type: str = "auto") -> str:
    psm = PSM_MODES.get(image_type, PSM_MODES["auto"])
    return f"--oem 3 --psm {psm}"


@app.get("/")
def health_check():
    return {"status": "healthy", "model": "Google Cloud Vision OCR"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    image_type: str = Query(default="auto"),
    lang: str = Query(default="eng"),
    source: str = Query(default="upload"),
):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # Apply enhanced preprocessing
        processed = preprocess_image(image, source)

        result = None

        # Use Google Vision API as primary
        if GOOGLE_CREDENTIALS_PRESENT:
            print("Using Google Vision API")
            vision_client = vision.ImageAnnotatorClient()

            img_byte_arr = io.BytesIO()
            processed.save(img_byte_arr, format='PNG')
            processed_bytes = img_byte_arr.getvalue()
            img_byte_arr.close()

            result = run_google_vision(vision_client, processed_bytes)
            del processed_bytes
            gc.collect()

            # For canvas: also try Vision on the original image and keep the better result
            if source == "canvas":
                original_result = run_google_vision(vision_client, contents)
                if original_result:
                    if result is None or original_result["confidence"] > result["confidence"]:
                        result = original_result
                gc.collect()

        # Fallback to Tesseract
        if not result:
            print("Using Tesseract fallback")
            config = get_tesseract_config(image_type)
            text = pytesseract.image_to_string(processed, lang=lang, config=config)
            result = {
                "text": text.strip(),
                "confidence": None,
                "words": [],
                "engine": "tesseract"
            }

        return {
            "success": True,
            "filename": file.filename,
            "text": result["text"],
            "engine": result.get("engine"),
            "confidence": result.get("confidence"),
            "words": result.get("words", []),
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="OCR processing failed")
