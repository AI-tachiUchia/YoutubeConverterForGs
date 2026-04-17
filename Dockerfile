FROM python:3.11-slim

# Install ffmpeg which is required by yt-dlp to extract MP3
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Many cloud providers like Render or Railway pass the port dynamically via the PORT environment variable
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
