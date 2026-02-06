FROM python:3.10-slim-bullseye

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appuser . .

USER appuser

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
