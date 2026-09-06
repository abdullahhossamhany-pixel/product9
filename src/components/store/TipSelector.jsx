import React from "react";
import { Input } from "@/components/ui/input";
import { HeartHandshake } from "lucide-react";

const PRESETS = [0, 10, 20, 50];

export default function TipSelector({ tip, setTip, customTip, setCustomTip }) {
  const handlePreset = (value) => {
    setTip(value);
    setCustomTip("");
  };

  const handleCustom = (e) => {
    const val = e.target.value;
    setCustomTip(val);
    setTip(Math.max(0, parseFloat(val) || 0));
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <HeartHandshake className="w-3.5 h-3.5 text-stone-500" />
        <span className="text-xs font-medium text-stone-600">Add a Tip (optional)</span>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {PRESETS.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => handlePreset(val)}
            className={`py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              tip === val && !customTip
                ? "bg-stone-900 text-white border-stone-900"
                : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
            }`}
          >
            {val === 0 ? "None" : `SAR ${val}`}
          </button>
        ))}
      </div>
      <Input
        type="number"
        min="0"
        step="0.01"
        placeholder="Custom amount"
        value={customTip}
        onChange={handleCustom}
        className="rounded-xl text-sm h-9"
      />
    </div>
  );
}