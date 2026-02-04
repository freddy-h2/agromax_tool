# Whisper Transcription Service

Microservicio que descarga videos a temp local y los transcribe con Whisper.

## Requisitos

- Python 3.10+
- ffmpeg instalado en el sistema
- ~2GB RAM para el modelo `small` (o más para `medium`)

## Instalación local

```bash
cd whisper-service
pip install -r requirements.txt
```

**Instalar ffmpeg:**
- Windows: `winget install ffmpeg` o descargar de https://ffmpeg.org
- Mac: `brew install ffmpeg`
- Linux: `sudo apt install ffmpeg` (Ubuntu/Debian)

## Ejecutar

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

El servicio queda en `http://localhost:8000`.

## Con Docker

```bash
docker build -t whisper-service .
docker run -p 8000:8000 whisper-service
```

## Variables de entorno

| Variable        | Default | Descripción                    |
|----------------|---------|--------------------------------|
| WHISPER_MODEL  | small   | base, small, medium, large-v3 |

## Endpoints

- `GET /health` — Verificar que el servicio está listo
- `POST /transcribe` — Body: `{ "video_url": "https://..." }`
