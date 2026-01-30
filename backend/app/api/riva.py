from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
from fastapi.responses import Response
from app.agents.riva_agent import riva_agent
from app.api.auth import get_current_user
import logging

router = APIRouter(prefix="/accessibility", tags=["Accessibility"])
logger = logging.getLogger(__name__)

class SpeakRequest(BaseModel):
    text: str

@router.post("/speak")
async def speak(request: SpeakRequest, user = Depends(get_current_user)):
    """Convert text to speech using NVIDIA Riva."""
    audio_content = await riva_agent.text_to_speech(request.text)
    if not audio_content:
        # Fallback indicated to client
        raise HTTPException(status_code=501, detail="NVIDIA RIVA TTS not available")
    
    return Response(content=audio_content, media_type="audio/wav")

@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...), user = Depends(get_current_user)):
    """Convert speech to text using NVIDIA Riva."""
    content = await file.read()
    text = await riva_agent.speech_to_text(content)
    if not text:
        raise HTTPException(status_code=500, detail="Transcription failed")
    
    return {"text": text}
