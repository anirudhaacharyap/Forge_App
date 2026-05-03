import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import base64
from app.main import app
from app.services.sarvam_service import sarvam_service
from app.core.exceptions import SarvamSTTException

client = TestClient(app)

# 1KB minimum requirement for validation
VALID_AUDIO_B64 = base64.b64encode(b"A" * 1024).decode()

@pytest.mark.asyncio
async def test_transcribe_success():
    # Test 1: POST /api/voice/transcribe returns 200 with valid audio and hi-IN
    mock_stt = {
        "transcript": "नमस्ते",
        "language_code": "hi-IN",
        "confidence": "HIGH",
        "word_count": 1
    }
    with patch("app.services.sarvam_service.sarvam_service.speech_to_text", new_callable=AsyncMock, return_value=mock_stt):
        response = client.post("/api/voice/transcribe", json={
            "audio_base64": VALID_AUDIO_B64,
            "language_code": "hi-IN",
            "audio_format": "wav"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["transcript"] == "नमस्ते"
        assert data["ready_for_analysis"] is True

@pytest.mark.asyncio
async def test_transcribe_low_confidence():
    # Test 2: POST /api/voice/transcribe sets ready_for_analysis False when confidence LOW
    mock_stt = {
        "transcript": "हाँ",
        "language_code": "hi-IN",
        "confidence": "LOW",
        "word_count": 1
    }
    with patch("app.services.sarvam_service.sarvam_service.speech_to_text", new_callable=AsyncMock, return_value=mock_stt):
        response = client.post("/api/voice/transcribe", json={
            "audio_base64": VALID_AUDIO_B64,
            "language_code": "hi-IN"
        })
        assert response.json()["ready_for_analysis"] is False

@pytest.mark.asyncio
async def test_transcribe_exception():
    # Test 3: POST /api/voice/transcribe returns 502 when SarvamSTTException raised
    with patch("app.services.sarvam_service.sarvam_service.speech_to_text", side_effect=SarvamSTTException("API Error")):
        response = client.post("/api/voice/transcribe", json={
            "audio_base64": VALID_AUDIO_B64,
            "language_code": "hi-IN"
        })
        assert response.status_code == 502
        assert "Sarvam STT error" in response.json()["detail"]

def test_transcribe_invalid_language():
    # Test 4: POST /api/voice/transcribe rejects invalid language_code
    response = client.post("/api/voice/transcribe", json={
        "audio_base64": VALID_AUDIO_B64,
        "language_code": "fr-FR"
    })
    assert response.status_code == 422

def test_transcribe_short_audio():
    # Test 5: POST /api/voice/transcribe rejects audio_base64 that is too short
    response = client.post("/api/voice/transcribe", json={
        "audio_base64": "YmFzZTY0", # very short
        "language_code": "hi-IN"
    })
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_synthesize_success():
    # Test 6: POST /api/voice/synthesize returns success: True with valid text
    with patch("app.services.sarvam_service.sarvam_service.synthesize", new_callable=AsyncMock, return_value="base64audio"):
        response = client.post("/api/voice/synthesize", json={
            "text": "Hello world",
            "language_code": "en-IN"
        })
        assert response.status_code == 200
        assert response.json()["success"] is True
        assert response.json()["audio_base64"] == "base64audio"

@pytest.mark.asyncio
async def test_synthesize_failure():
    # Test 7: POST /api/voice/synthesize returns success: False when TTS returns None
    with patch("app.services.sarvam_service.sarvam_service.synthesize", new_callable=AsyncMock, return_value=None):
        response = client.post("/api/voice/synthesize", json={
            "text": "Hello world",
            "language_code": "en-IN"
        })
        assert response.status_code == 200
        assert response.json()["success"] is False
        assert response.json()["audio_base64"] is None
        assert "unavailable" in response.json()["message"]

def test_synthesize_long_text():
    # Test 8: POST /api/voice/synthesize rejects text over 500 characters
    response = client.post("/api/voice/synthesize", json={
        "text": "A" * 501,
        "language_code": "en-IN"
    })
    assert response.status_code == 422
