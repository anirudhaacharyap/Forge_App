"use client";

import { useState, useEffect } from "react";

export default function LocationSelector({
  location,
  onLocationChange,
}: {
  location: { lat: number; lng: number };
  onLocationChange: (loc: { lat: number; lng: number }) => void;
}) {
  const [autoDetected, setAutoDetected] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areaName, setAreaName] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          onLocationChange({ lat, lng });
          
          // Reverse geocode to get area name
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(res => res.json())
            .then(data => {
              const area = data.address?.city || data.address?.town || data.address?.suburb || data.address?.state || "Unknown Area";
              setAreaName(area);
              setAutoDetected(true);
            })
            .catch(() => {
              setAutoDetected(true);
            });
        },
        () => {
          setError("Could not detect location");
          setManualMode(true);
        }
      );
    } else {
      setManualMode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!manualMode && autoDetected) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="material-symbols-outlined text-[#0F9B58] text-lg">
          my_location
        </span>
        <span className="text-[var(--color-text-secondary)]">
          {areaName ? `Location detected: ${areaName}` : `Location detected`}
        </span>
        <button
          onClick={() => setManualMode(true)}
          className="text-[var(--color-forge-red)] font-medium hover:underline"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="material-symbols-outlined text-[var(--color-text-secondary)] text-lg">
        location_on
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="any"
          value={location.lat || ""}
          onChange={(e) =>
            onLocationChange({ ...location, lat: parseFloat(e.target.value) || 0 })
          }
          placeholder="Latitude"
          className="w-28 px-2 py-1.5 text-xs bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] focus:border-[var(--color-primary-container)] focus:ring-1 focus:ring-[var(--color-primary-container)] outline-none"
          id="location-lat"
        />
        <input
          type="number"
          step="any"
          value={location.lng || ""}
          onChange={(e) =>
            onLocationChange({ ...location, lng: parseFloat(e.target.value) || 0 })
          }
          placeholder="Longitude"
          className="w-28 px-2 py-1.5 text-xs bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] focus:border-[var(--color-primary-container)] focus:ring-1 focus:ring-[var(--color-primary-container)] outline-none"
          id="location-lng"
        />
      </div>
      {error && (
        <span className="text-xs text-[var(--color-warning)]">{error}</span>
      )}
    </div>
  );
}
