"""Pydantic response models — single source of truth for all API response shapes."""

from pydantic import BaseModel


class MaterialProperties(BaseModel):
    tensile_strength: int
    ductility: int
    corrosion_resistance: int
    malleability: int
    thermal_resistance: int
    density: int
    surface_finish: str


class MaterialRecommendation(BaseModel):
    name: str
    category: str
    explanation: str
    composition: dict[str, float]
    properties: MaterialProperties
    grade: str | None = None


class AlternativeMaterial(BaseModel):
    name: str
    reason: str
    cost_difference: str


class StandardResult(BaseModel):
    standard: str
    status: str
    note: str


class StandardsResult(BaseModel):
    passed: bool
    standards_checked: list[str]
    details: list[StandardResult]


class FailureMode(BaseModel):
    type: str
    severity: str
    description: str
    prevention: str


class FailureResult(BaseModel):
    risk_level: str
    failure_modes: list[FailureMode]
    overall_recommendation: str


class CostEntry(BaseModel):
    name: str
    price_per_kg_min: float
    price_per_kg_max: float
    price_display: str
    tier: str
    currency: str = "INR"


class CostResult(BaseModel):
    comparison: list[CostEntry]


class Vendor(BaseModel):
    name: str
    address: str
    rating: float
    total_ratings: int
    distance_km: float | None
    maps_url: str
    phone: str | None
    open_now: bool | None


class VendorResult(BaseModel):
    vendors: list[Vendor]
    search_radius_km: int


class ConflictWarning(BaseModel):
    detected: bool
    conflicts: list[str]
    resolution: str | None


class FullAnalysisResponse(BaseModel):
    success: bool = True
    recommendation: MaterialRecommendation
    alternatives: list[AlternativeMaterial]
    standards: StandardsResult
    failure: FailureResult
    cost: CostResult
    vendors: VendorResult
    conflict_warning: ConflictWarning
    tts_audio_base64: str | None = None
    tts_language: str | None = None
    report_available: bool = True


class VoiceTranscribeResponse(BaseModel):
    transcript: str
    language_code: str
    confidence: str
    word_count: int
    ready_for_analysis: bool


class TTSSynthesizeResponse(BaseModel):
    audio_base64: str | None
    language_code: str
    character_count: int
    success: bool
    message: str | None = None
class ChatAnalysisResponse(BaseModel):
    success: bool = True
    chat_text: str
    detected_materials: list[str]
    suggested_actions: list[str]
    risk_level: str
    tts_audio_base64: str | None = None
    structured_data: FullAnalysisResponse | None = None
