"""
Microservicio de transcripción con Whisper.
Descarga el video a temp local, extrae audio y transcribe.
"""

import logging
import os
import tempfile
import traceback
import urllib.request
from contextlib import asynccontextmanager

import whisper
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Modelo Whisper (small = buen balance calidad/velocidad, ~1GB RAM)
# Alternativas: "base" (más rápido, menos preciso), "medium" (más preciso, más lento)
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Carga el modelo Whisper al iniciar."""
    app.state.whisper_model = whisper.load_model(WHISPER_MODEL)
    yield
    # Cleanup si hace falta
    del app.state.whisper_model


app = FastAPI(title="Whisper Transcription Service", lifespan=lifespan)


class TranscribeRequest(BaseModel):
    video_url: str


class TranscribeResponse(BaseModel):
    transcription: str
    success: bool = True


@app.get("/health")
def health():
    """Health check para verificar que el servicio está listo."""
    return {"status": "ok", "model": WHISPER_MODEL}


@app.post("/transcribe", response_model=TranscribeResponse)
def transcribe(request: TranscribeRequest):
    """
    Descarga el video desde la URL, extrae el audio y transcribe con Whisper.
    Usa carpeta temp local; los archivos se eliminan al terminar.
    """
    video_url = request.video_url.strip()
    if not video_url:
        raise HTTPException(status_code=400, detail="video_url vacío")

    with tempfile.TemporaryDirectory() as tmpdir:
        video_path = os.path.join(tmpdir, "video.mp4")
        try:
            # 1. Descargar video a temp local (con User-Agent para compatibilidad con Mux/CDN)
            req = urllib.request.Request(video_url, headers={"User-Agent": "Mozilla/5.0 (compatible; WhisperTranscriber/1.0)"})
            with urllib.request.urlopen(req, timeout=600) as resp:
                with open(video_path, "wb") as f:
                    chunk_size = 8192
                    while chunk := resp.read(chunk_size):
                        f.write(chunk)
        except Exception as e:
            logging.error("Error descargando video: %s\n%s", e, traceback.format_exc())
            raise HTTPException(
                status_code=400,
                detail=f"Error descargando video: {str(e)}"
            )

        if not os.path.exists(video_path) or os.path.getsize(video_path) == 0:
            raise HTTPException(
                status_code=400,
                detail="El archivo descargado está vacío o no existe"
            )

        try:
            # 2. Transcribir (Whisper extrae el audio internamente con ffmpeg)
            model = app.state.whisper_model
            result = model.transcribe(
                video_path,
                language="es",  # Español por defecto
                fp16=False,    # CPU-friendly
                verbose=False,
            )
            text = result.get("text", "").strip()
            if not text:
                text = "(No se pudo extraer texto del audio)"
            return TranscribeResponse(transcription=text)
        except Exception as e:
            logging.error("Error en transcripción: %s\n%s", e, traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Error en transcripción: {str(e)}"
            )
