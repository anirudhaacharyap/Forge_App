"""Voice router — transcription and synthesis endpoints."""

import logging
from fastapi import APIRouter, HTTPException, Request
from app.services.sarvam_service import sarvam_service
from app.models.requests import VoiceTranscribeRequest, TTSSynthesizeRequest
from app.models.responses import VoiceTranscribeResponse, TTSSynthesizeResponse
from app.core.limiter import limiter

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/voice/transcribe", response_model=VoiceTranscribeResponse)
@limiter.limit("20/minute")
async def transcribe_voice(request: Request, body: VoiceTranscribeRequest):
    """
    Receive base64 audio from Flutter, call Sarvam STT, return transcript.
    """
    result = await sarvam_service.speech_to_text(
        audio_base64=body.audio_base64,
        language_code=body.language_code,
        audio_format=body.audio_format,
    )

    ready_for_analysis = result["confidence"] in ["HIGH", "MEDIUM"]

    return VoiceTranscribeResponse(
        transcript=result["transcript"],
        language_code=result["language_code"],
        confidence=result["confidence"],
        word_count=result["word_count"],
        ready_for_analysis=ready_for_analysis,
    )


@router.post("/voice/synthesize", response_model=TTSSynthesizeResponse)
@limiter.limit("30/minute")
async def synthesize_voice(request: Request, body: TTSSynthesizeRequest):
    """
    Convert any text to Bulbul audio on demand.
    """
    audio_base64 = await sarvam_service.synthesize(
        text=body.text, language_code=body.language_code
    )

    if audio_base64:
        return TTSSynthesizeResponse(
            audio_base64=audio_base64,
            language_code=body.language_code,
            character_count=len(body.text),
            success=True,
        )
    else:
        return TTSSynthesizeResponse(
            audio_base64=None,
            language_code=body.language_code,
            character_count=len(body.text),
            success=False,
            message="Audio generation unavailable — please try again",
        )
