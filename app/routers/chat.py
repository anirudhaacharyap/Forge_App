"""Multimodal chat router for visual construction intelligence."""

from fastapi import APIRouter, Depends, HTTPException
from app.models.requests import MultimodalChatRequest
from app.models.responses import ChatAnalysisResponse
from app.services.gemini_service import GeminiService
from app.services.sarvam_service import sarvam_service
from app.services.translation_service import translation_service
from app.data.failure_map import FAILURE_MAP
from app.data.pricing_map import PRICING_MAP
import json
import logging

router = APIRouter(tags=["Multimodal Chat"])
gemini_service = GeminiService()
logger = logging.getLogger(__name__)


@router.post("/multimodal", response_model=ChatAnalysisResponse)
async def multimodal_chat(body: MultimodalChatRequest):
    """
    Handle multimodal chat queries with optional images.
    Supports both technical BREAKDOWN and conversational CHAT modes.
    """
    try:
        # 1. Prepare context for Gemini grounding
        pricing_context = json.dumps({k: v for k, v in PRICING_MAP.items()}, indent=2)
        # Simplify failure map for context (only names and types)
        failure_context = json.dumps([{"material": k[0], "env": k[1], "failures": [f["type"] for f in v]} for k, v in FAILURE_MAP.items()][:20], indent=2)

        # 2. Call Multimodal Gemini
        result = await gemini_service.multimodal_construction_reasoning(
            text=body.text,
            image_base64=body.image_base64,
            response_mode=body.response_mode.value,
            language=body.language.value,
            pricing_context=pricing_context,
            failure_context=failure_context
        )

        # 3. Handle TTS (non-fatal)
        tts_audio = None
        if body.response_mode.value == "CHAT":
            try:
                tts_audio = await sarvam_service.synthesize(
                    text=result.get("chat_text", ""),
                    language_code=body.language.value
                )
            except Exception as e:
                logger.warning(f"Chat TTS failed: {e}")

        return ChatAnalysisResponse(
            success=True,
            chat_text=result.get("chat_text", ""),
            detected_materials=result.get("detected_materials", []),
            suggested_actions=result.get("suggested_actions", []),
            risk_level=result.get("risk_level", "LOW"),
            tts_audio_base64=tts_audio,
            structured_data=result.get("structured_data")
        )

    except Exception as e:
        logger.error(f"Chat endpoint failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
