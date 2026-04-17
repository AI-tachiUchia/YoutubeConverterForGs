# YouTube MP3 API 🎵

A lightweight FastAPI service that downloads a YouTube video via `yt-dlp`, uses `ffmpeg` to extract the best possible MP3 audio, and returns it.
It's built specifically to be deployed on free cloud hosts (like Render or Railway) and connected to an iOS Shortcut, enabling MP3 extraction directly from the Apple Share Sheet.

## How to use

Check the Walkthrough document provided by Gemini for detailed step-by-step instructions on:
1. Deploying this instantly to Render using the included Dockerfile.
2. Creating the custom iOS Shortcut to send URLs directly from the YouTube app.
