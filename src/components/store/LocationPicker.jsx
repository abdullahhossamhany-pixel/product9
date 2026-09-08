import React, { useState, useRef, useEffect } from "react";
import { MapPin, Search, X, CheckCircle2, Home, Building2, ChevronDown, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";

const SAVED_LOCATION_KEY = "saved_villa_location";

const isRetalMode = () => true;

// Calculate shipping cost based on distance from Cairo hub
function calcShippingFromCoords(lat, lon) {
  // Cairo center
  const CAIRO_LAT = 30.06, CAIRO_LON = 31.25;
  const dlat = lat - CAIRO_LAT, dlon = lon - CAIRO_LON;
  const distKm = Math.sqrt(dlat * dlat + dlon * dlon) * 111;

  if (distKm < 20) return 30;
  if (distKm < 40) return 35;
  if (distKm < 80) return 45;
  if (distKm < 150) return 55;
  if (distKm < 300) return 70;
  if (distKm < 500) return 85;
  return 100;
}

export function isLocationComplete(delivery) {
  if (isRetalMode()) return !!(delivery?.villaNumber && delivery?.villaLetter);
  return !!(delivery?.address && delivery?.buildingName && delivery?.unitNumber);
}

function RetalPicker({ value, onChange }) {
  const [villaNumber, setVillaNumber] = useState(value?.villaNumber || "");
  const [villaLetter, setVillaLetter] = useState(value?.villaLetter || "");
  const [savedLocation, setSavedLocation] = useState(null);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_LOCATION_KEY) || "null");
      if (saved?.villaNumber && saved?.villaLetter) setSavedLocation(saved);
    } catch {}
  }, []);

  const update = (num, letter) => {
    if (!num || !letter) { onChange({}); return; }
    const isStoreVilla = String(num).trim() === "18" && String(letter).trim().toUpperCase() === "O";
    onChange({
      address: `Villa ${letter}-${num}, Retal Compound, Saudi Arabia`,
      buildingName: `Retal Compound`,
      unitNumber: `Villa ${letter}-${num}`,
      villaNumber: num,
      villaLetter: letter,
      shippingCost: isStoreVilla ? 0 : 0.5,
      city: "Retal Compound",
      governorate: "Saudi Arabia",
    });
    localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify({ villaNumber: num, villaLetter: letter }));
    setSavedLocation({ villaNumber: num, villaLetter: letter });
  };

  const useSavedLocation = () => {
    if (!savedLocation) return;
    setVillaNumber(savedLocation.villaNumber);
    setVillaLetter(savedLocation.villaLetter);
    update(savedLocation.villaNumber, savedLocation.villaLetter);
  };

  const clearSavedLocation = () => {
    localStorage.removeItem(SAVED_LOCATION_KEY);
    setSavedLocation(null);
  };

  const isComplete = !!(villaNumber && villaLetter);

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-stone-500" />
        Delivery Address — Retal Compound <span className="text-red-500">*</span>
      </Label>

      <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium flex items-center gap-2">
        🏘️ Delivery is only available inside <span className="font-bold">Retal Compound, Saudi Arabia</span>
      </div>

      {savedLocation && !(villaNumber === savedLocation.villaNumber && villaLetter === savedLocation.villaLetter) && (
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Bookmark className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm font-medium text-blue-800 truncate">
              Saved: Villa {savedLocation.villaLetter}-{savedLocation.villaNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={useSavedLocation} className="text-xs font-semibold text-blue-700 hover:underline">
              Use this
            </button>
            <button type="button" onClick={clearSavedLocation} className="text-blue-400 hover:text-blue-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-stone-700">Villa Number <span className="text-red-500">*</span></Label>
          <Input
            value={villaNumber}
            onChange={(e) => { setVillaNumber(e.target.value); update(e.target.value, villaLetter); }}
            placeholder="e.g. 42"
            className="rounded-xl mt-1 text-sm"
            type="number"
            min="1"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-stone-700">Villa Letter <span className="text-red-500">*</span></Label>
          <select
            value={villaLetter}
            onChange={(e) => { setVillaLetter(e.target.value); update(villaNumber, e.target.value); }}
            className="w-full mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
          >
            <option value="">Select letter...</option>
            {letters.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {isComplete && (
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-2.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold text-emerald-800">Villa {villaLetter}-{villaNumber}, Retal Compound</span>
        </div>
      )}
    </div>
  );
}

export default function LocationPicker({ value, onChange }) {
  const retalMode = isRetalMode();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(
    value?.address ? { display_name: value.address, lat: value._lat, lon: value._lon } : null
  );
  const [buildingName, setBuildingName] = useState(value?.buildingName || "");
  const [unitNumber, setUnitNumber] = useState(value?.unitNumber || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q) => {
    setQuery(q);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ", Egypt")}&format=json&addressdetails=1&limit=8&accept-language=ar,en`,
          { headers: { "Accept-Language": "ar,en" } }
        );
        const data = await res.json();
        setResults(data);
      } catch {}
      setLoading(false);
    }, 400);
  };

  const pickPlace = (place) => {
    setSelectedPlace(place);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    const shippingCost = calcShippingFromCoords(lat, lon);
    const shortAddress = place.display_name.split(",").slice(0, 4).join(",").trim();
    onChange({
      address: shortAddress,
      fullAddress: place.display_name,
      buildingName,
      unitNumber,
      shippingCost,
      city: place.address?.city || place.address?.town || place.address?.village || place.address?.suburb || "",
      governorate: place.address?.state || "",
      _lat: lat,
      _lon: lon,
    });
  };

  const updateDetails = (newBuilding, newUnit) => {
    if (!selectedPlace) return;
    const lat = parseFloat(selectedPlace.lat);
    const lon = parseFloat(selectedPlace.lon);
    const shippingCost = calcShippingFromCoords(lat, lon);
    const shortAddress = selectedPlace.display_name.split(",").slice(0, 4).join(",").trim();
    onChange({
      address: shortAddress,
      fullAddress: selectedPlace.display_name,
      buildingName: newBuilding,
      unitNumber: newUnit,
      shippingCost,
      city: selectedPlace.address?.city || selectedPlace.address?.town || selectedPlace.address?.village || selectedPlace.address?.suburb || "",
      governorate: selectedPlace.address?.state || "",
      _lat: lat,
      _lon: lon,
    });
  };

  const clearSelection = () => {
    setSelectedPlace(null);
    setBuildingName("");
    setUnitNumber("");
    setQuery("");
    setResults([]);
    onChange({});
  };

  const formatPlaceName = (place) => {
    const parts = place.display_name.split(",");
    const main = parts.slice(0, 2).join(",").trim();
    const sub = parts.slice(2, 4).join(",").trim();
    return { main, sub };
  };

  const isComplete = isLocationComplete(value);

  if (retalMode) return <RetalPicker value={value} onChange={onChange} />;

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-stone-500" />
        Delivery Address <span className="text-red-500">*</span>
      </Label>

      {/* Selected place summary */}
      {selectedPlace ? (
        <div className={`rounded-xl border-2 p-3 ${isComplete ? "border-emerald-300 bg-emerald-50" : "border-stone-200 bg-stone-50"}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <MapPin className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 leading-tight truncate">
                  {selectedPlace.display_name.split(",").slice(0, 3).join(",")}
                </p>
                {buildingName && <p className="text-xs text-stone-500 mt-0.5">🏢 {buildingName}{unitNumber ? ` — Apt/House ${unitNumber}` : ""}</p>}
              </div>
            </div>
            <button onClick={clearSelection} className="text-stone-400 hover:text-stone-700 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Change area link */}
          <button
            type="button"
            onClick={() => { setShowDropdown(true); setQuery(""); setResults([]); }}
            className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <ChevronDown className="w-3 h-3" /> Change area
          </button>
        </div>
      ) : (
        /* Search box */
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => search(e.target.value)}
              onFocus={() => query.length >= 2 && setShowDropdown(true)}
              placeholder="Search area, street, or landmark... e.g. Helwan, Mayo, Maadi"
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm bg-white transition-colors"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && results.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
              {results.map((place, i) => {
                const { main, sub } = formatPlaceName(place);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickPlace(place)}
                    className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-0 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900 leading-tight">{main}</p>
                        {sub && <p className="text-xs text-stone-400 mt-0.5 truncate">{sub}</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {showDropdown && query.length >= 2 && !loading && results.length === 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-xl px-4 py-4 text-sm text-stone-400 text-center">
              No results found. Try a different spelling.
            </div>
          )}
        </div>
      )}

      {/* Building & unit details — shown after selecting a place */}
      {selectedPlace && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Building / Villa Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={buildingName}
              onChange={(e) => {
                setBuildingName(e.target.value);
                updateDetails(e.target.value, unitNumber);
              }}
              placeholder="e.g. Mostafa Tower"
              className="rounded-xl mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
              <Home className="w-3 h-3" /> Apt / House No. <span className="text-red-500">*</span>
            </Label>
            <Input
              value={unitNumber}
              onChange={(e) => {
                setUnitNumber(e.target.value);
                updateDetails(buildingName, e.target.value);
              }}
              placeholder="e.g. Apt 5 / Floor 3"
              className="rounded-xl mt-1 text-sm"
            />
          </div>
        </div>
      )}

      {selectedPlace && !isComplete && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          ⚠️ Please fill in building name and apartment/house number to continue.
        </p>
      )}
    </div>
  );
}