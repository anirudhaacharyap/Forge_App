"""Sarvam AI service — handling Indian language STT and TTS."""

import base64
import logging
import httpx
from app.config import get_settings
from app.core.exceptions import SarvamSTTException

logger = logging.getLogger(__name__)


class SarvamService:
    """Service for Indian language speech-to-text and text-to-speech."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.sarvam_api_key
        self.stt_url = "https://api.sarvam.ai/speech-to-text"
        self.tts_url = "https://api.sarvam.ai/text-to-speech"
        self.timeout = 30.0

    async def speech_to_text(
        self,
        audio_base64: str,
        language_code: str = "hi-IN",
        audio_format: str = "wav",
    ) -> dict:
        """
        Convert base64 encoded audio to text transcript using Sarvam Saarika v2.5.
        """
        try:
            # 1. Decode base64
            audio_bytes = base64.b64decode(audio_base64)

            # 2. Validate size (10MB limit)
            if len(audio_bytes) > 10 * 1024 * 1024:
                raise SarvamSTTException("Audio file too large — maximum 10MB")

            # 3. Validate language code
            allowed_langs = [
                "hi-IN",
                "kn-IN",
                "ta-IN",
                "te-IN",
                "ml-IN",
                "en-IN",
            ]
            if language_code not in allowed_langs:
                raise SarvamSTTException("Unsupported language code")

            # 4. Prepare multipart request
            files = {
                "file": (
                    f"audio.{audio_format}",
                    audio_bytes,
                    f"audio/{audio_format}",
                )
            }
            data = {
                "language_code": language_code,
                "model": "saarika:v2.5",
                "with_timestamps": "false",
            }
            headers = {"api-subscription-key": self.api_key}

            # 5. Call Sarvam API
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.stt_url, headers=headers, data=data, files=files
                )

                if response.status_code != 200:
                    raise SarvamSTTException(
                        f"API returned status {response.status_code}: {response.text}"
                    )

                result = response.json()
                transcript = result.get("transcript", "").strip()

                if not transcript:
                    raise SarvamSTTException(
                        "Empty transcript returned — audio may be too short or unclear"
                    )

                # 6. Assign confidence
                word_count = len(transcript.split())
                if word_count > 10:
                    confidence = "HIGH"
                elif word_count >= 3:
                    confidence = "MEDIUM"
                else:
                    confidence = "LOW"

                logger.info(
                    f"STT Success: lang={language_code}, words={word_count}, confidence={confidence}"
                )

                return {
                    "transcript": transcript,
                    "language_code": language_code,
                    "confidence": confidence,
                    "word_count": word_count,
                }

        except SarvamSTTException:
            raise
        except httpx.TimeoutException:
            raise SarvamSTTException("Request to Sarvam AI timed out")
        except Exception as e:
            logger.error(f"Sarvam STT failed: {str(e)}")
            raise SarvamSTTException(str(e))

    async def synthesize(
        self, text: str, language_code: str = "en-IN", speaker: str = "ritu"
    ) -> str | None:
        """
        Convert text to speech using Sarvam Bulbul TTS.
        Never raises — returns None on any failure.
        """
        try:
            # 1. Truncate text (500 char limit)
            if len(text) > 500:
                text = text[:497] + "..."
                logger.warning(f"TTS input truncated to 500 chars: {text}")

            # 2. Call Sarvam API
            payload = {
                "inputs": [text],
                "target_language_code": language_code,
                "speaker": speaker,
                "pitch": 0,
                "pace": 1.0,
                "loudness": 1.5,
                "enable_preprocessing": True,
                "model": "bulbul:v1",
            }
            headers = {"api-subscription-key": self.api_key}

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.tts_url, headers=headers, json=payload
                )

                if response.status_code != 200:
                    logger.error(
                        f"Sarvam TTS API error {response.status_code}: {response.text}"
                    )
                    return None

                return response.json()["audios"][0]

        except Exception as e:
            logger.error(f"Sarvam TTS failed: {str(e)}")
            return None

    def build_tts_summary(
        self,
        material_name: str,
        explanation: str,
        risk_level: str,
        language_code: str,
    ) -> str:
        """
        Build a concise TTS summary in the target language.
        Max 500 characters to stay within Sarvam's limit.
        """
        material_name = material_name.strip()
        risk_level = risk_level.strip()
        explanation = explanation.strip()[:200]

        templates = {
            "en-IN": "Recommended material: {name}. {explanation} Risk level: {risk}.",
            "hi-IN": "अनुशंसಿತ सामग्री: {name}. {explanation} जोखिम स्तर: {risk}.",
            "kn-IN": "ಶಿಫಾರಸು ಮಾಡಿದ ವಸ್ತು: {name}. {explanation} ಅಪಾಯದ ಮಟ್ಟ: {risk}.",
        }

        template = templates.get(language_code, templates["en-IN"])
        summary = template.format(
            name=material_name, explanation=explanation, risk=risk_level
        )

        return summary[:500]


sarvam_service = SarvamService()
