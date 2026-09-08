const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Search, Clock, Package, Truck, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import LiveTrackingMap from "@/components/store/LiveTrackingMap";

const STEPS = [
  { key: "pending",   label: "Pending",   icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: Package },
  { key: "shipped",   label: "Shipped",   icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const STATUS_ORDER = ["pending", "confirmed", "shipped", "delivered"];

export default function OrderStatus() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setOrders(null);

    const isEmail = q.includes("@");
    let results = [];

    if (isEmail) {
      const [active, history] = await Promise.all([
        db.entities.Order.filter({ customer_email: q }),
        db.entities.OrderHistory.filter({ customer_email: q }),
      ]);
      results = [...active, ...history];
    } else {
      // Search by partial id match across active orders and order history
      const [allActive, allHistory] = await Promise.all([
        db.entities.Order.list("-created_date", 200),
        db.entities.OrderHistory.list("-created_date", 200),
      ]);
      results = [...allActive, ...allHistory].filter((o) => o.id?.endsWith(q) || o.id === q);
    }

    if (results.length === 0) {
      setError("No orders found. Please check your Order ID or email.");
    } else {
      setOrders(results);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Track Your Order</h1>
          <p className="text-stone-500 mt-2">Enter your Order ID or email address to check your order status.</p>
        </div>

        <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm mb-6">
          <Label className="text-sm font-medium text-stone-700">Order ID or Email</Label>
          <div className="flex gap-3 mt-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. abc12345 or you@email.com"
              className="rounded-xl flex-1"
            />
            <Button type="submit" disabled={loading} className="bg-stone-900 hover:bg-stone-800 rounded-xl px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </form>

        <AnimatePresence>
          {orders && orders.map((order) => {
            const isCancelled = order.status === "cancelled";
            const currentStep = STATUS_ORDER.indexOf(order.status);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm mb-4"
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-xs text-stone-400 font-mono">#{order.id?.slice(-8)}</p>
                    <p className="font-semibold text-stone-900 mt-0.5">{order.customer_name || order.customer_email}</p>
                    {order.created_date && (
                      <p className="text-xs text-stone-400 mt-0.5">
                        Placed on {format(new Date(order.created_date), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <p className="text-lg font-bold text-stone-900">SAR {order.total?.toFixed(2)}</p>
                </div>

                {/* Items */}
                <div className="bg-stone-50 rounded-xl p-3 mb-5 text-sm text-stone-600">
                  {order.items?.map((item, i) => (
                    <span key={i}>{item.product_name} ×{item.quantity}{i < order.items.length - 1 ? ", " : ""}</span>
                  ))}
                </div>

                {/* Timeline */}
                {isCancelled ? (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                    <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-red-700">Order Cancelled</p>
                      <p className="text-xs text-red-500 mt-0.5">This order has been cancelled.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between relative">
                    {/* Connecting line */}
                    <div className="absolute top-5 left-5 right-5 h-0.5 bg-stone-100 z-0" />
                    <div
                      className="absolute top-5 left-5 h-0.5 bg-stone-900 z-0 transition-all duration-700"
                      style={{ width: currentStep <= 0 ? "0%" : `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const done = idx <= currentStep;
                      const active = idx === currentStep;
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-2 z-10 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            done
                              ? "bg-stone-900 border-stone-900"
                              : "bg-white border-stone-200"
                          } ${active ? "ring-4 ring-stone-200" : ""}`}>
                            <Icon className={`w-4 h-4 ${done ? "text-white" : "text-stone-300"}`} />
                          </div>
                          <span className={`text-xs font-medium text-center ${done ? "text-stone-900" : "text-stone-400"}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!isCancelled && <LiveTrackingMap order={order} />}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}