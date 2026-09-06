const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";

const statusColors = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      let email = null;
      try {
        const user = await db.auth.me();
        email = user.email;
      } catch {}

      // Load from entity (for logged-in users) + localStorage
      let entityOrders = [];
      if (email) {
        entityOrders = await db.entities.OrderHistory.filter({ customer_email: email }, "-created_date");
      }

      // Also load from localStorage for guest orders
      const localOrders = JSON.parse(localStorage.getItem("order_history") || "[]");

      // Merge, deduplicate by id
      const merged = [...entityOrders];
      for (const lo of localOrders) {
        if (!merged.find(o => o.id === lo.id)) merged.push(lo);
      }
      merged.sort((a, b) => new Date(b.created_date || b.placedAt) - new Date(a.created_date || a.placedAt));
      setOrders(merged);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link to={createPageUrl("Store")} className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
        <h1 className="text-3xl font-bold text-stone-900 mb-8">Order History</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 text-lg">No orders yet</p>
            <Link to={createPageUrl("Store")}>
              <Button className="mt-6 bg-stone-900 hover:bg-stone-800 rounded-xl">Shop Now</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div
                key={order.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-stone-100 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-xs text-stone-400">#{(order.id || "").slice(-8)}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {order.created_date
                        ? format(new Date(order.created_date), "MMM d, yyyy · h:mm a")
                        : order.placedAt
                        ? format(new Date(order.placedAt), "MMM d, yyyy · h:mm a")
                        : "—"}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${statusColors[order.status] || statusColors.pending}`}>
                    {order.status || "pending"}
                  </Badge>
                </div>

                <div className="space-y-1 mb-3">
                  {(order.items || []).map((item, j) => (
                    <div key={j} className="flex justify-between text-sm">
                      <span className="text-stone-600">{item.product_name} ×{item.quantity}</span>
                      <span className="text-stone-700 font-medium">SAR {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-100 pt-3 flex flex-wrap gap-3 justify-between text-sm">
                  <div className="text-stone-500">
                    {order.city && <span>📍 {order.city} — Delivery: SAR {(order.shipping_cost || 0).toFixed(2)}</span>}
                    {order.payment_method && (
                      <span className="ml-3">{order.payment_method === "visa" ? "💳 Visa" : "💵 Cash"}</span>
                    )}
                  </div>
                  <span className="font-bold text-stone-900">Total: SAR {order.total?.toFixed(2)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}