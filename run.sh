#!/bin/bash
cd /Users/caris/.gemini/antigravity/scratch/yt-mp3-api

# Start the Python API Server in the background
source venv/bin/activate
uvicorn main:app --port 8000 &
API_PID=$!

# Start Ngrok to create the public HTTPS tunnel
# We need to replace YOUR_STATIC_DOMAIN_HERE with your actual free domain from Ngrok
./ngrok http --domain=suburbicarian-unwarrantable-claud.ngrok-free.dev 8000 &
NGROK_PID=$!

# Wait and safely close if interrupted
wait
kill $API_PID
kill $NGROK_PID
