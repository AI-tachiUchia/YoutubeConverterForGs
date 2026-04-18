from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import yt_dlp
import os
import uuid
import glob

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DownloadRequest(BaseModel):
    url: str

def cleanup_files(identifier: str):
    """Deletes the downloaded files after returning them to the user to save disk space."""
    for file in glob.glob(f"/tmp/{identifier}*"):
        try:
            os.remove(file)
        except Exception as e:
            print(f"Error deleting file {file}: {e}")

@app.post("/convert")
async def convert_video(request: DownloadRequest, background_tasks: BackgroundTasks):
    url = request.url
    if not url:
        raise HTTPException(status_code=400, detail="Missing YouTube URL")
    
    unique_id = str(uuid.uuid4())
    # Save temporarily in /tmp
    output_template = f"/tmp/{unique_id}_%(title)s.%(ext)s"

    # Resolve cookies path relative to this script's directory
    cookies_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cookies.txt')

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_template,
        'cookiefile': cookies_path,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'extractor_args': {
            'youtube': {
                'player_client': ['tv', 'mweb']
            }
        },
        'quiet': False,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            
            # The postprocessor changes the file extension to .mp3. Let's find it.
            files = glob.glob(f"/tmp/{unique_id}_*.mp3")
            if not files:
                raise Exception("Conversion finished but expected .mp3 file was not found.")
            
            final_filename = files[0]
            # Clean up the filename so it doesn't contain our random UUID when the user downloads it
            filename_for_download = os.path.basename(final_filename).replace(f"{unique_id}_", "")

            # Schedule the cleanup task to run AFTER the file response has been fully sent
            background_tasks.add_task(cleanup_files, unique_id)

            return FileResponse(
                path=final_filename, 
                media_type='audio/mpeg', 
                filename=filename_for_download
            )
            
    except Exception as e:
        # In case of an error, also try to clean up any partial files
        cleanup_files(unique_id)
        raise HTTPException(status_code=500, detail=f"Failed to process video: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "YT-MP3 API is running! Send a POST request with {'url': '...'} to /convert"}
