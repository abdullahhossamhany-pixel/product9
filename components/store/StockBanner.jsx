import React from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

export default function StockBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-6 pt-4"
    >
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 font-medium">
          🇪🇬 This stock is Egyptian — once it's sold out it will come back in about 6–8 months.
        </p>
      </div>
    </motion.div>
  );
}