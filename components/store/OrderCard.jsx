const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { format } from "date-fns";
import { Clock, CheckCircle, Package, Truck, Home, XCircle, AlertTriangle, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import LiveTrackingMap from "@/components/store/LiveTrackingMap";

const STEPS = [
  { key: "pending",   icon: Clock,        label: "Order Placed",     desc: "Waiting for confirmation" },
  { key: "confirmed", icon: CheckCircle,  label: "Confirmed",        desc: "Order confirmed by seller" },
  { key: "shipped",   icon: Truck,        label: "On the Way",       desc: "Your package is shipped" },
  { key: "delivered", icon: Home,         label: "Delivered",        desc: "Enjoy your order!" },
];

const STATUS_ORDER = ["pending", "confirmed", "shipped", "delivered"];

export default function OrderCard({ order, onCancelled }) {
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isCancelled = order.status === "cancelled";
  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const canCancel = !isCancelled && order.status !== "delivered";
  const [rating, setRating] = useState(order.delivery_rating || 0);
  const [hasRated, setHasRated] = useState(!!order.delivery_rating);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState(order.delivery_rating_comment || "");
  const [submittingRating, setSubmittingRating] = useState(false);

  const submitRating = async () => {
    if (!rating) return;
    setSubmittingRating(true);
    try {
      await db.entities.Order.update(order.id, {
        delivery_rating: rating,
        delivery_rating_comment: ratingComment,
        delivery_rated_at: new Date().toISOString(),
      });
      setHasRated(true);
      toast.success("Thanks for rating!");
    } catch {
      toast.error("Could not submit rating");
    }
    setSubmittingRating(false);
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await db.entities.Order.update(order.id, { status: "cancelled" });
      toast.success("Order cancelled successfully");
      setShowConfirm(false);
      if (onCancelled) onCancelled(order.id);
    } catch {
      toast.error("Could not cancel order");
    }
    setCancelling(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-0.5">Order</p>
          <p className="font-mono text-sm text-stone-600">#{order.id?.slice(-8)}</p>
          <p className="text-xs text-stone-400 mt-1">
            {order.created_date && format(new Date(order.created_date), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-stone-900 text-lg">SAR {order.total?.toFixed(2)}</p>
          {order.tip > 0 && (
            <p className="text-xs text-emerald-600 font-medium">+ SAR {order.tip.toFixed(2)} tip</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-5 pb-5 border-b border-stone-100">
        {order.items?.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-stone-600">
              {item.product_name}{item.variant ? ` (${item.variant})` : ""} <span className="text-stone-400">×{item.quantity}</span>
            </span>
            <span className="font-medium text-stone-800">SAR {(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 pt-2">
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 font-medium">💵 Cash on Delivery</span>
        </div>
      </div>

      {/* Cancelled state */}
      {isCancelled ? (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-700">Order Cancelled</p>
            <p className="text-xs text-red-500 mt-0.5">This order has been cancelled.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Pending — waiting for confirmation */}
          {order.status === "pending" && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 animate-pulse" />
              <div>
                <p className="font-medium text-amber-800">Awaiting Confirmation</p>
                <p className="text-xs text-amber-600 mt-0.5">The seller will confirm your order shortly. Tracking will be available once confirmed.</p>
              </div>
            </div>
          )}

          {/* Tracking steps — shown once confirmed */}
          {order.status !== "pending" && (
            <div className="space-y-0">
              {STEPS.map((step, idx) => {
                const done = idx <= currentIndex;
                const active = idx === currentIndex;
                const StepIcon = step.icon;
                const isLast = idx === STEPS.length - 1;

                return (
                  <div key={step.key} className="flex gap-3">
                    {/* Icon + connector */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        done
                          ? active
                            ? "bg-stone-900 text-white shadow-md"
                            : "bg-emerald-500 text-white"
                          : "bg-stone-100 text-stone-300"
                      }`}>
                        <StepIcon className="w-4 h-4" />
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-6 mt-1 ${idx < currentIndex ? "bg-emerald-400" : "bg-stone-100"}`} />
                      )}
                    </div>
                    {/* Text */}
                    <div className="pb-4">
                      <p className={`text-sm font-medium ${done ? "text-stone-900" : "text-stone-300"}`}>
                        {step.label}
                      </p>
                      <p className={`text-xs mt-0.5 ${active ? "text-stone-500" : done ? "text-stone-400" : "text-stone-300"}`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {order.shipping_address && (
        <p className="text-xs text-stone-400 mt-3 border-t border-stone-100 pt-3">
          📍 {order.shipping_address}
        </p>
      )}

      {order.status === "delivered" && (
        <div className="mt-3 border-t border-stone-100 pt-3 space-y-2">
          {order.delivery_proof_url && (
            <a href={order.delivery_proof_url} target="_blank" rel="noreferrer">
              <img src={order.delivery_proof_url} alt="Delivery proof" className="rounded-xl border border-stone-100 max-h-40 object-cover mb-2" />
            </a>
          )}
          <p className="text-xs font-semibold text-stone-700">Rate your delivery</p>
          {hasRated ? (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-4 h-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}`} />
              ))}
              {ratingComment && <p className="text-xs text-stone-500 ml-2 italic">"{ratingComment}"</p>}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} className="p-0.5">
                    <Star className={`w-5 h-5 ${(hoverRating || rating) >= s ? "fill-amber-400 text-amber-400" : "text-stone-300"}`} />
                  </button>
                ))}
              </div>
              <input value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Add a note (optional)" className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm mb-2" />
              <button onClick={submitRating} disabled={submittingRating || !rating} className="text-xs bg-stone-900 text-white rounded-lg px-3 py-1.5 disabled:opacity-50">
                {submittingRating ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          )}
        </div>
      )}

      {!isCancelled && <LiveTrackingMap order={order} />}

      {canCancel && !showConfirm && (
        <button
          onClick={() => setShowConfirm(true)}
          className="mt-3 text-xs text-red-400 hover:text-red-600 underline underline-offset-2"
        >
          Cancel this order
        </button>
      )}

      {showConfirm && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700 font-medium">Cancel this order?</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowConfirm(false)} className="text-xs text-stone-500 hover:text-stone-700 px-2 py-1 rounded-lg border border-stone-200 bg-white">No</button>
            <button onClick={handleCancel} disabled={cancelling} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg flex items-center gap-1">
              {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Yes, Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}