import React from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CartItem({ item, stock = Infinity, onUpdateQty, onRemove }) {
  return (
    <div className="flex gap-4 py-4 border-b border-stone-100 last:border-0">
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-50 flex-shrink-0">
        {item.image_url ? (
          <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <ShoppingBag className="w-6 h-6" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-stone-900 truncate">{item.product_name}</h4>
        {item.variant && (
          <p className="text-xs text-stone-500 mt-0.5">Option: <span className="font-medium text-stone-700">{item.variant}</span></p>
        )}
        <p className="text-sm text-stone-500 mt-0.5">SAR {item.price?.toFixed(2)} each</p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => onUpdateQty(item.product_id, item.variant || null, item.quantity - 1)}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => onUpdateQty(item.product_id, item.variant || null, item.quantity + 1)}
            disabled={item.quantity >= stock}
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-auto text-stone-400 hover:text-red-500"
            onClick={() => onRemove(item.product_id, item.variant || null)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <p className="font-semibold text-stone-900 whitespace-nowrap">
        SAR {(item.price * item.quantity).toFixed(2)}
      </p>
    </div>
  );
}