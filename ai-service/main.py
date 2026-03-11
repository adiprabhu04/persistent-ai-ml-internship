from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import vision
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
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

    # 3. Upscale canvas images 4x for better detail
    if source == "canvas":
        new_size = (image.width * 4, image.height * 4)
        image = image.resize(new_size, Image.Resampling.LANCZOS)

    # 4. Denoise (reduce pencil texture, paper grain)
    image = image.filter(ImageFilter.MedianFilter(size=3))

    # 5. Strong contrast boost
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)

    # 6. Sharpen edges
    image = image.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))

    # 7. Normalize brightness
    enhancer = ImageEnhance.Brightness(image)
    image = enhancer.enhance(1.1)

    # 8. Adaptive thresholding for canvas drawings
    if source == "canvas":
        try:
            from scipy.ndimage import gaussian_filter
            img_array = np.array(image, dtype=np.float64)
            blurred = gaussian_filter(img_array, sigma=20)
            binary = img_array > (blurred - 10)
            image = Image.fromarray((binary * 255).astype(np.uint8))
        except ImportError:
            pass  # scipy not available, skip adaptive threshold

    return image


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
            try:
                vision_client = vision.ImageAnnotatorClient()

                img_byte_arr = io.BytesIO()
                processed.save(img_byte_arr, format='PNG')
                content = img_byte_arr.getvalue()

                vision_image = vision.Image(content=content)
                response = vision_client.document_text_detection(
                    image=vision_image,
                    image_context={"language_hints": ["en"]}
                )

                if response.text_annotations:
                    full_text = response.text_annotations[0].description

                    # Extract word-level confidence
                    words = []
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

                    avg_confidence = sum(w["confidence"] for w in words) / len(words) if words else 85.0
                    result = {
                        "text": full_text.strip(),
                        "confidence": round(avg_confidence, 1),
                        "words": words,
                        "engine": "google_vision"
                    }
            except Exception as e:
                print(f"Google Vision error: {str(e)}")

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
