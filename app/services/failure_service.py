"""Failure service — wrapper around failure_map for service-layer consistency."""

from app.data.failure_map import get_failure_modes_dict
from app.services.translation_service import translation_service
import logging

logger = logging.getLogger(__name__)


class FailureService:
    """Service for failure mode detection and risk assessment."""

    def analyze_failures(
        self,
        material_name: str,
        environment: str,
        conflict_check: dict = None,
        language: str = "en-IN",
    ) -> dict:
        """
        Analyze potential failure modes for a material in a given environment.
        Returns risk level, failure modes, and recommendation in the target language.
        """
        result = get_failure_modes_dict(material_name, environment)

        # Override with AI-detected conflicts if they indicate high risk
        if conflict_check and conflict_check.get("has_conflicts"):
            if conflict_check.get("suggested_risk_level") == "HIGH":
                result["risk_level"] = "HIGH"
                # Prepend severe failure modes detected by AI
                for mode in reversed(conflict_check.get("severe_failure_modes", [])):
                    result["failure_modes"].insert(0, {
                        "type": "Requirement Conflict",
                        "severity": "HIGH",
                        "description": f"Potential failure due to conflicting requirements: {mode}",
                        "prevention": "Review and resolve conflicting project parameters."
                    })

        # Step 2: Translate results if needed
        if language != "en-IN":
            result["risk_level"] = translation_service.translate(result["risk_level"], language)
            result["overall_recommendation"] = translation_service.translate(result["overall_recommendation"], language)
            
            for mode in result["failure_modes"]:
                mode["type"] = translation_service.translate(mode["type"], language)
                mode["description"] = translation_service.translate(mode["description"], language)
                mode["prevention"] = translation_service.translate(mode["prevention"], language)

        logger.info(
            f"Failure analysis for '{material_name}' in '{environment}': "
            f"risk_level={result['risk_level']}, modes={len(result['failure_modes'])}"
        )

        return result


failure_service = FailureService()
