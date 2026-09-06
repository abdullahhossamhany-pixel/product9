import React, { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Base shipping from Cairo hub (EGP), per governorate
export const EGYPT_GOVERNORATES = {
  "Cairo": {
    base: 30,
    cities: ["Maadi", "Helwan", "Mayo", "Nasr City", "Heliopolis", "Zamalek", "Downtown Cairo", "Shubra", "Ain Shams", "Mokattam", "New Cairo", "5th Settlement", "Rehab", "Madinaty", "Shorouk", "Badr City", "Obour", "Katameya", "El Marg", "El Matareyya", "Hadayek El Kobba", "Manshiet Nasser", "El Basatin", "Dar El Salam", "El Salam City", "Imbaba (Cairo side)"]
  },
  "Giza": {
    base: 32,
    cities: ["Dokki", "Mohandessin", "Agouza", "Haram", "Faisal", "6th of October", "Sheikh Zayed", "Hadayek October", "Imbaba", "El Warraq", "Kerdasa", "Abu Rawash", "El Hawamdeyya", "El Badrashin", "El Ayat", "Atfih", "Saqqara"]
  },
  "Alexandria": {
    base: 50,
    cities: ["El Montaza", "El Raml", "El Anfushi", "El Attarin", "El Gomrok", "El Labban", "Sidi Gaber", "Sporting", "Glim", "Cleopatra", "San Stefano", "Smouha", "Miami", "Mandara", "El Amreya", "El Dekhila", "Agami", "Borg El Arab", "El Mex", "El Mahmoudeya", "Kafr El Dawwar", "Damanhur (Alex)"]
  },
  "Qalyubia": {
    base: 35,
    cities: ["Benha", "Qalyub", "Shubra El Kheima", "Khanka", "El Khanka", "Toukh", "Kafr Shukr", "Qaha", "El Obour", "Shibin El Qanatir", "El Qanatir El Khayreyya"]
  },
  "Sharqia": {
    base: 48,
    cities: ["Zagazig", "10th of Ramadan", "Bilbeis", "Minya El Qamh", "Abu Hammad", "El Salihiyya", "Faqous", "El Husseineyya", "Deyerb Negm", "Kafr Saqr", "El Ibrahimeyya"]
  },
  "Dakahlia": {
    base: 52,
    cities: ["Mansoura", "Talkha", "Mit Ghamr", "Aga", "Dekernes", "El Sinbellawin", "Belqas", "Sherbin", "Matareyya (Dak)", "Gamasa", "El Mansoura El Gedida"]
  },
  "Gharbia": {
    base: 50,
    cities: ["Tanta", "El Mahalla El Kubra", "Kafr El Zayat", "Zefta", "El Santa", "Basyoun", "Sammanoud", "Samannoud"]
  },
  "Monufia": {
    base: 45,
    cities: ["Shibin El Kom", "Sadat City", "Menuf", "El Bagor", "Ashmoun", "El Shohada", "Quesna", "Berket El Sab", "Tala"]
  },
  "Beheira": {
    base: 52,
    cities: ["Damanhur", "Kafr El Dawwar", "Rashid", "Edko", "Abu El Matamir", "Kom Hamada", "El Delengat", "El Mahmoudeya", "Wadi El Natroun", "Housh Eissa"]
  },
  "Kafr El Sheikh": {
    base: 55,
    cities: ["Kafr El Sheikh", "Desouk", "Fuwwah", "El Reyad", "Baltim", "Sidi Salem", "Biala", "Qallin"]
  },
  "Damietta": {
    base: 58,
    cities: ["Damietta", "New Damietta", "Far Shout", "El Zarqa", "El Serw", "Kafr El Battikh", "Kafr Saad"]
  },
  "Port Said": {
    base: 60,
    cities: ["Port Said", "Port Fouad", "El Zohour", "El Arab", "El Manakh", "El Dawahi", "El Sharq"]
  },
  "Ismailia": {
    base: 55,
    cities: ["Ismailia", "Fayed", "El Qantara", "El Qantara Gharb", "Abu Soweir", "El Tall El Kabeer", "El Kassassin"]
  },
  "Suez": {
    base: 58,
    cities: ["Suez", "Ain Sokhna", "Faysal (Suez)", "Arbaeen", "El Ganayen"]
  },
  "North Sinai": {
    base: 75,
    cities: ["Arish", "Sheikh Zuweid", "Rafah", "Bir El Abd", "Nakhl", "El Hasana"]
  },
  "South Sinai": {
    base: 82,
    cities: ["Sharm El Sheikh", "Dahab", "Nuweiba", "Taba", "Saint Catherine", "Tur El Sinai", "Ras Sidr", "Abu Zenima"]
  },
  "Red Sea": {
    base: 78,
    cities: ["Hurghada", "Safaga", "Quseer", "Marsa Alam", "Halayeb", "Shalatin", "El Gouna", "Makadi Bay", "Soma Bay"]
  },
  "Matrouh": {
    base: 80,
    cities: ["Mersa Matrouh", "El Alamein", "Sidi Barrani", "Sollum", "Siwa", "El Hamam", "El Dabaa"]
  },
  "Fayoum": {
    base: 50,
    cities: ["Fayoum", "Ibsheway", "Sinnuris", "Tamiya", "Yousuf El Seddiq", "El Agameyin"]
  },
  "Beni Suef": {
    base: 55,
    cities: ["Beni Suef", "El Fashn", "Beba", "El Wasta", "Ihnasya El Medina", "Naser (Beni Suef)"]
  },
  "Minya": {
    base: 65,
    cities: ["Minya", "Maghagha", "Beni Mazar", "Matay", "Samalut", "Abu Qurqas", "Mallawi", "Deirut (Minya)", "El Adwa"]
  },
  "Assiut": {
    base: 70,
    cities: ["Assiut", "Dairut", "Manfalut", "Qusiya", "Abnoub", "Abu Tig", "El Ghanaym", "Sahel Selim"]
  },
  "Sohag": {
    base: 72,
    cities: ["Sohag", "Akhmim", "Tahta", "Gerga", "Girga", "Tema", "El Maragha", "Dar El Salam (Sohag)", "Juhayna", "El Balyana"]
  },
  "Qena": {
    base: 75,
    cities: ["Qena", "Luxor (Qena)", "Naqada", "Qus", "Abu Tesht", "El Waqf", "Deshna", "Farshout", "Nag Hammadi"]
  },
  "Luxor": {
    base: 78,
    cities: ["Luxor City", "Karnak", "El Tod", "Armant", "Isna", "El Bayadeyya", "El Qarna", "El Zayneya"]
  },
  "Aswan": {
    base: 85,
    cities: ["Aswan", "Kom Ombo", "Edfu", "El Darow", "Abu Simbel", "Nasr El Nuba", "Toshka"]
  },
  "New Valley": {
    base: 95,
    cities: ["Kharga", "Dakhla", "Farafra", "Baris", "Paris (New Valley)"]
  }
};

export function calcShipping(governorate, city) {
  if (!governorate) return 0;
  const gov = EGYPT_GOVERNORATES[governorate];
  if (!gov) return 0;
  let base = gov.base;
  // Cairo special rules for high-distance cities
  if (governorate === "Cairo") {
    if (["Madinaty", "Shorouk", "Badr City", "Obour"].includes(city)) base = 40;
    else if (["New Cairo", "5th Settlement", "Rehab", "Katameya"].includes(city)) base = 35;
  }
  if (governorate === "Giza") {
    if (["6th of October", "Sheikh Zayed", "Hadayek October"].includes(city)) base = 38;
  }
  return base;
}

export default function DeliveryCalculator({ governorate, city, street, onChange, onExtraCost }) {
  const govList = Object.keys(EGYPT_GOVERNORATES);
  const cityList = governorate ? (EGYPT_GOVERNORATES[governorate]?.cities || []) : [];
  const shippingCost = calcShipping(governorate, city);

  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState(null);
  const [extraCost, setExtraCost] = useState(0);
  const debounceRef = useRef(null);

  const handleGov = (e) => {
    onChange({ governorate: e.target.value, city: "", street });
    setConfirmedAddress(null);
    setSuggestions([]);
    setExtraCost(0);
    onExtraCost && onExtraCost(0);
  };
  const handleCity = (e) => {
    onChange({ governorate, city: e.target.value, street });
    setConfirmedAddress(null);
    setSuggestions([]);
    setExtraCost(0);
    onExtraCost && onExtraCost(0);
  };

  const handleStreet = (e) => {
    const val = e.target.value;
    onChange({ governorate, city, street: val });
    setConfirmedAddress(null);
    setExtraCost(0);
    onExtraCost && onExtraCost(0);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 4 || !city) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const query = `${val}, ${city}, ${governorate}, Egypt`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=eg`,
          { headers: { "Accept-Language": "en" } }
        );
        const results = await res.json();
        setSuggestions(results);
      } catch {}
      setSearching(false);
    }, 600);
  };

  const pickSuggestion = (place) => {
    const label = place.display_name;
    onChange({ governorate, city, street: label });
    setSuggestions([]);

    // Calculate extra cost based on distance from city center (rough estimate)
    // If lat/lon available, compute simple distance bonus
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    // Cairo center: 30.06, 31.25
    const CAIRO_LAT = 30.06, CAIRO_LON = 31.25;
    const dlat = lat - CAIRO_LAT, dlon = lon - CAIRO_LON;
    const distKm = Math.sqrt(dlat * dlat + dlon * dlon) * 111;
    // Add EGP 5 per 50km beyond 50km
    const extra = distKm > 50 ? Math.floor((distKm - 50) / 50) * 5 : 0;
    setExtraCost(extra);
    onExtraCost && onExtraCost(extra);
    setConfirmedAddress({ label, distKm: Math.round(distKm) });
  };

  return (
    <div className="space-y-3">
      {/* Governorate */}
      <div>
        <Label className="text-xs font-semibold text-stone-700">Governorate <span className="text-red-500">*</span></Label>
        <select
          value={governorate}
          onChange={handleGov}
          required
          className="w-full mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
        >
          <option value="">Select governorate...</option>
          {govList.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* City */}
      {governorate && (
        <div>
          <Label className="text-xs font-semibold text-stone-700">City / District <span className="text-red-500">*</span></Label>
          <select
            value={city}
            onChange={handleCity}
            required
            className="w-full mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
          >
            <option value="">Select city...</option>
            {cityList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {/* Street / House */}
      {city && (
        <div className="relative">
          <Label className="text-xs font-semibold text-stone-700">Street / Building / Apartment <span className="text-red-500">*</span></Label>
          <div className="relative mt-1">
            <Input
              value={street}
              onChange={handleStreet}
              required
              placeholder="e.g. 12 El Nour St, Building 4, Apt 3"
              className="rounded-xl"
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 animate-pulse">Searching...</span>
            )}
          </div>
          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 bg-white border border-stone-200 rounded-xl shadow-lg mt-1 overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickSuggestion(s)}
                  className="w-full text-left px-3 py-2.5 text-xs text-stone-700 hover:bg-stone-50 border-b border-stone-100 last:border-0 leading-snug"
                >
                  📍 {s.display_name}
                </button>
              ))}
            </div>
          )}
          {confirmedAddress && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5">
              <span>✅</span>
              <span className="truncate">{confirmedAddress.label.split(",").slice(0, 3).join(",")}</span>
              <span className="ml-auto whitespace-nowrap">~{confirmedAddress.distKm} km</span>
            </div>
          )}
        </div>
      )}

      {/* Shipping cost preview */}
      {city && (
        <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-stone-600">🚚 Base delivery to {city}</span>
            <span className="font-bold text-stone-800">SAR {shippingCost}</span>
          </div>
          {extraCost > 0 && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-stone-500 text-xs">📍 Remote area surcharge</span>
              <span className="font-semibold text-amber-600 text-xs">+SAR {extraCost}</span>
            </div>
          )}
          {confirmedAddress && (
            <div className="flex items-center justify-between mt-1 border-t border-stone-200 pt-1">
              <span className="text-stone-500 text-xs">Total delivery</span>
              <span className="font-bold text-emerald-700">SAR {shippingCost + extraCost}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}