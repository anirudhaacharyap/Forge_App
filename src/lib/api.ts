const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

/* ── Types ── */

export interface AnalysisPayload {
  input_type: "text" | "voice_transcript" | "photo" | "advanced";
  text: string | null;
  photo_base64: string | null;
  advanced_params: {
    tensile_strength: number;
    ductility: number;
    corrosion_resistance: number;
    malleability: number;
    thermal_resistance: number;
    density: number;
    surface_finish: "glossy" | "matte" | "brushed";
  } | null;
  location: { lat: number; lng: number };
  language: "en-IN" | "hi-IN" | "kn-IN" | "fr-FR" | "es-ES";
}

export interface MaterialProperties {
  tensile_strength: number;
  ductility: number;
  corrosion_resistance: number;
  malleability: number;
  thermal_resistance: number;
  density: number;
  surface_finish: string;
}

export interface Recommendation {
  name: string;
  category: string;
  explanation: string;
  composition: Record<string, number>;
  properties: MaterialProperties;
  grade: string;
}

export interface StandardDetail {
  standard: string;
  status: "PASS" | "FAIL" | "WARNING";
  note: string;
}

export interface Standards {
  passed: boolean;
  standards_checked: string[];
  details: StandardDetail[];
}

export interface FailureMode {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  prevention: string;
}

export interface Failure {
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  failure_modes: FailureMode[];
  overall_recommendation: string;
}

export interface CostItem {
  name: string;
  price_per_kg_min: number;
  price_per_kg_max: number;
  price_display: string;
  tier: string;
  currency: string;
}

export interface Cost {
  comparison: CostItem[];
}

export interface Vendor {
  name: string;
  address: string;
  rating: number;
  total_ratings: number;
  distance_km: number;
  maps_url: string;
  phone: string | null;
  open_now: boolean | null;
}

export interface Vendors {
  vendors: Vendor[];
  search_radius_km: number;
}

export interface Alternative {
  name: string;
  reason: string;
  cost_difference: string;
}

export interface ConflictWarning {
  detected: boolean;
  conflicts: string[];
  resolution: string | null;
}

export interface AnalysisResponse {
  success: boolean;
  error?: string;
  recommendation: Recommendation;
  alternatives: Alternative[];
  standards: Standards;
  failure: Failure;
  cost: Cost;
  vendors: Vendors;
  conflict_warning: ConflictWarning;
  tts_audio_base64: string | null;
  tts_language: string;
  report_available: boolean;
}

export interface MaterialItem {
  name: string;
  category: string;
  composition: Record<string, number>;
  properties: MaterialProperties;
  grade: string;
  use_cases: string[];
  standards: string[];
}

export interface IdentifyPhotoPayload {
  photo_base64: string;
}

export interface IdentifyPhotoResponse {
  success: boolean;
  identification: {
    identified_material: string;
    confidence: string;
    material_category: string;
    visible_condition: string;
    recommended_action: string;
  };
}

export interface VendorSearchPayload {
  material_name: string;
  location: { lat: number; lng: number };
  radius_km: number;
}

export interface VoiceTranscribePayload {
  audio_base64: string;
  language_code: "hi-IN" | "kn-IN" | "ta-IN" | "te-IN" | "ml-IN" | "en-IN";
  audio_format: "wav" | "mp3";
}

export interface VoiceTranscribeResponse {
  transcript: string;
  ready_for_analysis: boolean;
  confidence?: string;
}

export interface VoiceSynthesizePayload {
  text: string;
  language_code: "hi-IN" | "kn-IN" | "en-IN";
}

export interface VoiceSynthesizeResponse {
  audio_base64: string;
}

/* ── API Functions ── */

export async function submitAnalysis(payload: AnalysisPayload): Promise<AnalysisResponse> {
  const res = await fetch(`${API_URL}/api/full-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // Handle HTTP-level errors (502, 400, etc.) with descriptive backend messages
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody.error) errorMsg = errBody.error;
      else if (errBody.detail) errorMsg = errBody.detail;
    } catch {
      // Response wasn't JSON — use status text
      errorMsg = `Server error: ${res.statusText || res.status}`;
    }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "Analysis failed");
  }
  return data;
}

export async function fetchMaterials(filters?: Record<string, string>): Promise<MaterialItem[]> {
  const params = new URLSearchParams(filters || {});
  const url = `${API_URL}/api/materials${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.materials || [];
}

export async function identifyPhoto(payload: IdentifyPhotoPayload): Promise<IdentifyPhotoResponse> {
  const res = await fetch(`${API_URL}/api/identify-photo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data;
}

export async function searchVendors(payload: VendorSearchPayload): Promise<Vendors> {
  const res = await fetch(`${API_URL}/api/vendors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data;
}

export async function generateReport(analysisData: AnalysisResponse): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/report/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(analysisData),
  });
  if (!res.ok) {
    throw new Error("Report generation failed");
  }
  return res.blob();
}

export async function login(): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@forge.com", password: "password123" }),
  });
  if (!res.ok) {
    throw new Error("Login failed");
  }
  const data = await res.json();
  return data.token;
}

export async function saveProject(token: string, analysisData: AnalysisResponse): Promise<any> {
  const res = await fetch(`${API_URL}/api/projects/save`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(analysisData),
  });
  if (!res.ok) {
    throw new Error("Failed to save project");
  }
  return res.json();
}

export async function getProjects(token: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/api/projects/list`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw new Error("Failed to fetch projects");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.projects || []);
}

export async function transcribeVoice(payload: VoiceTranscribePayload): Promise<VoiceTranscribeResponse> {
  const res = await fetch(`${API_URL}/api/voice/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Voice transcription failed");
  }
  return res.json();
}

export async function synthesizeVoice(payload: VoiceSynthesizePayload): Promise<VoiceSynthesizeResponse> {
  const res = await fetch(`${API_URL}/api/voice/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Voice synthesis failed");
  }
  return res.json();
}
