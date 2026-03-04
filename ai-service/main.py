from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import vision
import pytesseract
from PIL import Image, ImageEnhance, ImageOps
import io

app = FastAPI(title="Notely OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PSM_MODES = {
    "auto": 3,
    "document": 6,
    "screenshot": 6,
    "photo": 11,
    "sparse": 11,
}


def preprocess_image(image: Image.Image, image_type: str = "auto") -> Image.Image:
    if image.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", image.size, (255, 255, 255))
        rgba = image.convert("RGBA")
        background.paste(rgba, mask=rgba.split()[3])
        image = background
    elif image.mode != "RGB":
        image = image.convert("RGB")

    image = image.convert("L")

    # Upscale small images for better OCR accuracy
    w, h = image.size
    if min(w, h) < 1000:
        scale = 1000 / min(w, h)
        image = image.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    # Add padding to help with edge text detection
    image = ImageOps.expand(image, border=10, fill=255)

    # Adaptive contrast instead of aggressive binary thresholding
    image = ImageOps.autocontrast(image, cutoff=2)

    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(1.3)

    return image


def get_tesseract_config(image_type: str = "auto") -> str:
    psm = PSM_MODES.get(image_type, PSM_MODES["auto"])
    return f"--oem 3 --psm {psm}"


def extract_words_from_response(response) -> tuple:
    """Extract text, overall confidence and per-word confidence from Vision response."""
    full_text = response.full_text_annotation.text

    words_data = []
    total_confidence = 0.0
    word_count = 0

    for page in response.full_text_annotation.pages:
        for block in page.blocks:
            for paragraph in block.paragraphs:
                for word in paragraph.words:
                    word_text = "".join([symbol.text for symbol in word.symbols])
                    confidence = word.confidence
                    words_data.append({
                        "text": word_text,
                        "confidence": round(confidence * 100, 1),
                    })
                    total_confidence += confidence
                    word_count += 1

    overall_confidence = round((total_confidence / word_count * 100) if word_count > 0 else 0.0, 1)

    return full_text, overall_confidence, words_data


@app.get("/")
def health_check():
    return {"status": "healthy", "model": "Google Cloud Vision OCR"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    image_type: str = Query(default="auto", description="Image type: auto, document, screenshot, photo, sparse"),
    lang: str = Query(default="eng", description="Tesseract language code (used as fallback)"),
):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        try:
            client = vision.ImageAnnotatorClient()
            vision_image = vision.Image(content=contents)
            image_context = vision.ImageContext(language_hints=["en"])

            response = client.document_text_detection(
                image=vision_image,
                image_context=image_context,
            )

            if response.error.message:
                raise Exception(response.error.message)

            text, confidence, words = extract_words_from_response(response)

            # Retry with broader language hints if confidence is low
            if 0 < confidence < 60:
                image_context_retry = vision.ImageContext(
                    language_hints=["en", "fr", "de", "es"]
                )
                response_retry = client.document_text_detection(
                    image=vision_image,
                    image_context=image_context_retry,
                )
                if not response_retry.error.message:
                    text_retry, confidence_retry, words_retry = extract_words_from_response(response_retry)
                    if confidence_retry > confidence:
                        text, confidence, words = text_retry, confidence_retry, words_retry

            return {
                "success": True,
                "filename": file.filename,
                "text": text.strip(),
                "confidence": confidence,
                "words": words,
                "engine": "google_vision",
            }

        except Exception:
            processed = preprocess_image(image, image_type)
            config = get_tesseract_config(image_type)
            text = pytesseract.image_to_string(processed, lang=lang, config=config)

            return {
                "success": True,
                "filename": file.filename,
                "text": text.strip(),
                "confidence": None,
                "words": [],
                "engine": "tesseract",
            }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="OCR processing failed")
