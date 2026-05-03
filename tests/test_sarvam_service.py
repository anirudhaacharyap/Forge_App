import pytest
import httpx
from unittest.mock import patch, MagicMock
from app.services.sarvam_service import sarvam_service
from app.core.exceptions import SarvamSTTException

@pytest.mark.asyncio
async def test_stt_success():
    # Test 1: speech_to_text returns correct structure on success
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"transcript": "मुझे एक गेट चाहिए", "language_code": "hi-IN"}
    
    with patch("httpx.AsyncClient.post", return_value=mock_response):
        # 4 words in Hindi: "मुझे", "एक", "गेट", "चाहिए"
        # Wait, the requirement says "HIGH if > 10 words, MEDIUM if 3-10 words, LOW if < 3 words"
        # 4 words should be MEDIUM.
        # But the prompt says "Assert confidence is HIGH (5 words > 3 word threshold — recount: 4 Hindi words)"
        # This is contradictory in the prompt. I'll follow the logic in my code: 4 words = MEDIUM.
        result = await sarvam_service.speech_to_text("YmFzZTY0YXVkaW9kYXRh", "hi-IN")
        assert result["transcript"] == "मुझे एक गेट चाहिए"
        assert result["language_code"] == "hi-IN"
        assert result["confidence"] == "MEDIUM" 

@pytest.mark.asyncio
async def test_stt_empty_transcript():
    # Test 2: speech_to_text raises SarvamSTTException on empty transcript
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"transcript": "", "language_code": "hi-IN"}
    
    with patch("httpx.AsyncClient.post", return_value=mock_response):
        with pytest.raises(SarvamSTTException, match="Empty transcript"):
            await sarvam_service.speech_to_text("YmFzZTY0YXVkaW9kYXRh", "hi-IN")

@pytest.mark.asyncio
async def test_stt_oversized_audio():
    # Test 3: speech_to_text raises SarvamSTTException on oversized audio
    # 11MB of 'A' characters
    oversized_base64 = base64.b64encode(b"A" * (11 * 1024 * 1024)).decode()
    with pytest.raises(SarvamSTTException, match="Audio file too large"):
        await sarvam_service.speech_to_text(oversized_base64)

import base64

@pytest.mark.asyncio
async def test_stt_invalid_language():
    # Test 4: speech_to_text raises SarvamSTTException on invalid language code
    with pytest.raises(SarvamSTTException, match="Unsupported language code"):
        await sarvam_service.speech_to_text("YmFzZTY0", "fr-FR")

@pytest.mark.asyncio
async def test_stt_http_401():
    # Test 5: speech_to_text raises SarvamSTTException on HTTP 401
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.text = "Unauthorized"
    
    with patch("httpx.AsyncClient.post", return_value=mock_response):
        with pytest.raises(SarvamSTTException, match="401"):
            await sarvam_service.speech_to_text("YmFzZTY0")

@pytest.mark.asyncio
async def test_stt_timeout():
    # Test 6: speech_to_text raises SarvamSTTException on timeout
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Timeout")):
        with pytest.raises(SarvamSTTException, match="timed out"):
            await sarvam_service.speech_to_text("YmFzZTY0")

@pytest.mark.asyncio
async def test_synthesize_success():
    # Test 7: synthesize returns base64 audio on success
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"audios": ["base64audiostring"]}
    
    with patch("httpx.AsyncClient.post", return_value=mock_response):
        result = await sarvam_service.synthesize("Hello")
        assert result == "base64audiostring"

@pytest.mark.asyncio
async def test_synthesize_failure():
    # Test 8: synthesize returns None on HTTP error — never raises
    mock_response = MagicMock()
    mock_response.status_code = 500
    
    with patch("httpx.AsyncClient.post", return_value=mock_response):
        result = await sarvam_service.synthesize("Hello")
        assert result is None

@pytest.mark.asyncio
async def test_synthesize_truncation():
    # Test 9: synthesize truncates text over 500 characters
    long_text = "A" * 600
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"audios": ["audio"]}
    
    with patch("httpx.AsyncClient.post", return_value=mock_response) as mock_post:
        await sarvam_service.synthesize(long_text)
        # Check call args
        args, kwargs = mock_post.call_args
        payload = kwargs["json"]
        assert len(payload["inputs"][0]) <= 500
        assert payload["inputs"][0].endswith("...")

def test_build_summary_templates():
    # Test 10: build_tts_summary returns correct language template
    # Kannada
    res = sarvam_service.build_tts_summary("Steel", "Strong", "Low", "kn-IN")
    assert "ವಸ್ತು" in res
    # Hindi
    res = sarvam_service.build_tts_summary("Steel", "Strong", "Low", "hi-IN")
    assert "सामग्री" in res
    # English
    res = sarvam_service.build_tts_summary("Steel", "Strong", "Low", "en-IN")
    assert "Recommended material" in res
    # Fallback
    res = sarvam_service.build_tts_summary("Steel", "Strong", "Low", "xyz")
    assert "Recommended material" in res

def test_build_summary_truncation():
    # Test 11: build_tts_summary truncates long explanation
    long_exp = "B" * 300
    res = sarvam_service.build_tts_summary("Steel", long_exp, "Low", "en-IN")
    # Explanation is truncated to 200
    # Summary starts with "Recommended material: Steel. " (27 chars)
    # Then explanation (200 chars)
    # Then " Risk level: Low." (17 chars)
    # Total ~ 244 chars
    assert len(res) < 300
