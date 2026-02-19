from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image, ImageEnhance
import io

app = FastAPI(title="Notely OCR Service (Lite)")

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

    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(1.2)

    low, high = image.getextrema()
    if high - low < 100:
        mid = (low + high) // 2
        image = image.point(lambda p: 255 if p > mid else 0)

    return image


def get_tesseract_config(image_type: str = "auto") -> str:
    psm = PSM_MODES.get(image_type, PSM_MODES["auto"])
    return f"--oem 3 --psm {psm}"


@app.get("/")
def health_check():
    return {"status": "healthy", "model": "Tesseract OCR"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    image_type: str = Query(default="auto", description="Image type: auto, document, screenshot, photo, sparse"),
    lang: str = Query(default="eng", description="Tesseract language code"),
):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        processed = preprocess_image(image, image_type)

        config = get_tesseract_config(image_type)
        text = pytesseract.image_to_string(processed, lang=lang, config=config)

        return {
            "success": True,
            "filename": file.filename,
            "text": text.strip(),
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="OCR processing failed")
