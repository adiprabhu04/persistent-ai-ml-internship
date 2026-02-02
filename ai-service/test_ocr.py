import easyocr

reader = easyocr.Reader(['en'], gpu=False)

image_path = 'sample_handwriting.jpg'

print("🔍 Reading image... (This may take a moment first time)")

result = reader.readtext(image_path, detail=0)

print("\n--- RESULTS ---")
full_text = " ".join(result)
print(full_text)