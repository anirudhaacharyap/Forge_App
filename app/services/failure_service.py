"""Failure service — wrapper around failure_map for service-layer consistency."""

from app.data.failure_map import get_failure_modes_dict
import logging

logger = logging.getLogger(__name__)


class FailureService:
    """Service for failure mode detection and risk assessment."""

    def analyze_failures(self, material_name: str, environment: str, conflict_check: dict = None) -> dict:
        """
        Analyze potential failure modes for a material in a given environment.
        Returns risk level, failure modes, and recommendation.
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

        logger.info(
            f"Failure analysis for '{material_name}' in '{environment}': "
            f"risk_level={result['risk_level']}, modes={len(result['failure_modes'])}"
        )

        return result


failure_service = FailureService()
