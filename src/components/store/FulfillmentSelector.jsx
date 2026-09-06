import React from "react";
import { Home, Truck, Clock, Calendar } from "lucide-react";

export default function FulfillmentSelector({ value, onChange }) {
  const { mode, scheduledDate } = value;

  const setMode = (m) => onChange({ ...value, mode: m });
  const setDate = (d) => onChange({ ...value, scheduledDate: d });

  const today = new Date();
  const minDate = new Date(today.getTime() + 86400000).toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode("delivery")}
          className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${
            mode === "delivery"
              ? "border-stone-900 bg-stone-50"
              : "border-stone-200 bg-white hover:border-stone-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-stone-700" />
            <span className="text-sm font-semibold text-stone-900">Delivery</span>
          </div>
          <p className="text-xs text-stone-500">To your villa in Retal Compound</p>
        </button>
        <button
          type="button"
          onClick={() => setMode("pickup")}
          className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${
            mode === "pickup"
              ? "border-stone-900 bg-stone-50"
              : "border-stone-200 bg-white hover:border-stone-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-stone-700" />
            <span className="text-sm font-semibold text-stone-900">Pickup</span>
          </div>
          <p className="text-xs text-stone-500">Collect from our store</p>
        </button>
      </div>

      {mode === "pickup" ? (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium flex items-center gap-2">
          🏠 Come to pick up your order at <span className="font-bold">Villa O-18, Retal Compound</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3" /> Schedule delivery date
            </label>
            <input
              type="date"
              value={scheduledDate || ""}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>
          <div className="flex flex-col justify-end">
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              {scheduledDate
                ? `Est. arrival ${new Date(scheduledDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}, afternoon`
                : "Est. delivery in 1-2 days after you pick a date"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}