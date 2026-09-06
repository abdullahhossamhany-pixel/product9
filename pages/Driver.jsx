const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useSearchParams } from "react-router-dom";
import OrderScanner from "@/components/driver/OrderScanner";
import HouseNumberScanner from "@/components/driver/HouseNumberScanner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin, Package, Loader2, CheckCircle2, RefreshCw, QrCode, ScanLine, AlertTriangle } from "lucide-react";

const norm = (s) => (s || "").toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");

const extractVilla = (addr) => {
  if (!addr) return "";
  const m = addr.toUpperCase().match(/[A-Z]\s*-\s*\d+/);
  if (m) return norm(m[0]);
  const m2 = addr.match(/\b\d+\b/);
  return m2 ? m2[0] : "";
};

export default function Driver() {
  const [params, setParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [authed, setAuthed] = useState(null);
  const [house, setHouse] = useState(null); // { detected, file_url }
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    db.auth.isAuthenticated().then(setAuthed);
  }, []);

  const parseOrderId = (raw) => {
    if (!raw) return "";
    try {
      const u = new URL(raw, window.location.origin);
      const o = u.searchParams.get("order");
      if (o) return o;
    } catch {}
    return raw.trim();
  };

  const loadOrder = async (rawId) => {
    const id = parseOrderId(rawId);
    if (!id) return;
    setLoadingOrder(true);
    setDone(false);
    setOrder(null);
    setHouse(null);
    try {
      const o = await db.entities.Order.get(id);
      if (!o?.id) throw new Error("not found");
      setOrder(o);
      setParams({ order: id });
    } catch {
      toast.error("Order not found");
    }
    setLoadingOrder(false);
  };

  useEffect(() => {
    const id = params.get("order");
    if (id) loadOrder(id);
    // eslint-disable-next-line
  }, []);

  const expected = order ? extractVilla(order.shipping_address) : "";
  const matchInfo =
    expected && house?.detected
      ? (() => {
          const e = norm(expected);
          const d = norm(house.detected);
          return d && (d.includes(e) || e.includes(d));
        })()
      : null;

  const confirm = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      await db.entities.Order.update(order.id, {
        delivery_proof_url: house?.file_url || "",
        status: "delivered",
      });
      setOrder((o) => ({ ...o, delivery_proof_url: house?.file_url || "", status: "delivered" }));
      setDone(true);
      toast.success("Delivery confirmed");
    } catch {
      toast.error("Could not confirm delivery");
    }
    setSubmitting(false);
  };

  const reset = () => {
    setOrder(null);
    setHouse(null);
    setDone(false);
    setParams({});
  };

  if (authed === false) {
    return (
      <div className="max-w-md mx-auto py-16 px-6 text-center">
        <Package className="w-10 h-10 text-stone-400 mx-auto mb-3" />
        <h1 className="text-xl font-semibold mb-2">Driver sign in</h1>
        <p className="text-stone-500 text-sm mb-6">Sign in to confirm a delivery.</p>
        <Button onClick={() => db.auth.redirectToLogin()}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-lg bg-stone-900 flex items-center justify-center text-white">
          <Package className="w-4 h-4" />
        </div>
        <h1 className="text-lg font-bold">Driver Delivery Proof</h1>
      </div>

      {/* Step 1 — QR */}
      {!order && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-bold">1</span>
            <p className="font-semibold flex items-center gap-1"><QrCode className="w-4 h-4" /> Scan the order QR</p>
          </div>
          <p className="text-sm text-stone-500 mb-4 ml-8">
            Download the QR from the order in Try Market, then scan it here with the camera.
          </p>
          <OrderScanner onDetected={(raw) => loadOrder(raw)} />
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              loadOrder(e.currentTarget.order.value);
            }}
          >
            <input
              name="order"
              placeholder="Or enter the order reference"
              className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
            <Button type="submit" size="sm">Load</Button>
          </form>
          {loadingOrder && (
            <div className="flex justify-center mt-4">
              <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
            </div>
          )}
        </div>
      )}

      {/* Step 2 — House number */}
      {order && !house && !done && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="font-mono text-xs text-stone-400">#{order.id?.slice(-8)}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">QR scanned</span>
            </div>
            <p className="font-semibold">{order.customer_name || order.customer_email}</p>
            {order.shipping_address && (
              <p className="text-sm text-stone-500 mt-1 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 mt-0.5" /> {order.shipping_address}
              </p>
            )}
            <p className="text-sm text-stone-500 mt-2">
              {order.items?.map((i) => `${i.product_name} ×${i.quantity}`).join(", ")}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-bold">2</span>
              <p className="font-semibold flex items-center gap-1"><ScanLine className="w-4 h-4" /> Scan the house number</p>
            </div>
            <p className="text-sm text-stone-500 mb-4 ml-8">
              Point the camera at the house number on the gate/wall — it's read automatically.
            </p>
            <HouseNumberScanner onResult={setHouse} />
          </div>

          <button onClick={() => setOrder(null)} className="w-full text-xs text-stone-500">Scanned wrong order? Start over</button>
        </div>
      )}

      {/* Step 3 — Compare & confirm */}
      {order && house && !done && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <p className="font-mono text-xs text-stone-400 mb-1">#{order.id?.slice(-8)}</p>
            <p className="font-semibold">{order.customer_name || order.customer_email}</p>
            {order.shipping_address && (
              <p className="text-sm text-stone-500 mt-1 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 mt-0.5" /> {order.shipping_address}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            {house.file_url && (
              <img src={house.file_url} alt="House" className="rounded-xl w-full object-cover max-h-56 mb-3" />
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="text-[11px] text-stone-400 uppercase tracking-wide">Expected</p>
                <p className="font-bold text-stone-900">{expected || "—"}</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="text-[11px] text-stone-400 uppercase tracking-wide">Scanned</p>
                <p className="font-bold text-stone-900">{house.detected || "—"}</p>
              </div>
            </div>
            {matchInfo === true && (
              <p className="mt-3 text-sm text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> House number matches the order address.
              </p>
            )}
            {matchInfo === false && (
              <p className="mt-3 text-sm text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> House number does not match. Check the address before confirming.
              </p>
            )}
          </div>

          <Button className="w-full" disabled={submitting} onClick={confirm}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirm delivery
          </Button>
          <button onClick={() => setHouse(null)} className="w-full text-xs text-stone-500">Re-scan house number</button>
        </div>
      )}

      {order && done && (
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold">Delivery confirmed</p>
          <p className="text-stone-500 text-sm mt-1">Order #{order.id?.slice(-8)} marked as delivered.</p>
          <Button className="w-full mt-5" onClick={reset}>Scan another order</Button>
        </div>
      )}
    </div>
  );
}