from fastapi import FastAPI, UploadFile, File
import easyocr
import shutil
import os

app = FastAPI()

# 1. Load the AI Model ONCE when the server starts
# (This saves time so we don't reload it for every request)
print("🚀 Loading AI Model... (This may take a minute)")
reader = easyocr.Reader(['en'], gpu=False)
print("✅ Model Loaded and Ready!")

@app.get("/")
def home():
    return {"status": "AI Service is Running", "model": "EasyOCR"}

@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    """
    Receives an image file, saves it temporarily, runs OCR, 
    and returns the text.
    """
    temp_filename = f"temp_{file.filename}"
    
    try:
        # Save the uploaded file to disk temporarily
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run OCR
        # detail=0 means "just give me the text, not the coordinates"
        result = reader.readtext(temp_filename, detail=0)
        
        # Combine the list of words into one string
        full_text = " ".join(result)
        
        return {
            "filename": file.filename, 
            "text": full_text
        }
    
    except Exception as e:
        return {"error": str(e)}
        
    finally:
        # Cleanup: Delete the temp file so we don't fill up the disk
        if os.path.exists(temp_filename):
            os.remove(temp_filename)