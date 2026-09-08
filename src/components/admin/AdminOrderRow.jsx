const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Package, Clock, Truck, CheckCircle, XCircle, Calendar, Send, Upload, Download, Loader2, MessageSquareText, Image as ImageIcon, QrCode } from "lucide-react";
import CourierLocationSharer from "@/components/admin/CourierLocationSharer";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

const statusConfig = {
  pending: { icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { icon: Package, color: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped: { icon: Truck, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  delivered: { icon: CheckCircle, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { icon: XCircle, color: "bg-red-50 text-red-700 border-red-200" },
};

export default function AdminOrderRow({ order, onStatusChange }) {
  const queryClient = useQueryClient();
  const qrWrapRef = useRef(null);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const status = statusConfig[order.status] || statusConfig.pending;

  const downloadQr = () => {
    const canvas = qrWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `trymarket-order-qr-${order.id?.slice(-8)}.png`;
    a.click();
  };

  const sendMessage = async () => {
    if (!msg.trim() || !order.customer_email) return;
    setSending(true);
    try {
      await db.entities.CustomerNotification.create({
        customer_email: order.customer_email,
        type: "delivery",
        title: "Order update",
        message: msg.trim(),
        link: "Orders",
      });
      setMsg("");
      toast.success("Message sent to customer");
    } catch {
      toast.error("Could not send message");
    }
    setSending(false);
  };

  const uploadProof = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      await db.entities.Order.update(order.id, { delivery_proof_url: file_url });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Delivery proof saved");
    } catch {
      toast.error("Could not upload proof");
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="bg-white rounded-xl border border-stone-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <p className="font-mono text-xs text-stone-400">#{order.id?.slice(-8)}</p>
            <p className="text-xs text-stone-400">
              {order.created_date && format(new Date(order.created_date), "MMM d, yyyy")}
            </p>
            {order.scheduled_for && (
              <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs gap-1">
                <Calendar className="w-3 h-3" /> Scheduled {format(new Date(order.scheduled_for), "MMM d, yyyy")}
              </Badge>
            )}
          </div>
          <p className="font-medium text-stone-900">{order.customer_name || order.customer_email}</p>
          <p className="text-sm text-stone-500 mt-0.5">
            {order.items?.map((i) => `${i.product_name}${i.variant ? ` (${i.variant})` : ""} ×${i.quantity}`).join(", ")}
          </p>
          {order.shipping_address && (
            <p className="text-xs text-stone-400 mt-1">{order.shipping_address}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-bold text-stone-900 text-lg">SAR {order.total?.toFixed(2)}</p>
            {order.tip > 0 && (
              <p className="text-xs text-emerald-600 font-medium">+ SAR {order.tip.toFixed(2)} tip</p>
            )}
          </div>
          <Select value={order.status || "pending"} onValueChange={(v) => onStatusChange(order.id, v)}>
            <SelectTrigger className="w-36 rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {order.status === "shipped" && (
        <div className="mt-3 pt-3 border-t border-stone-100">
          <CourierLocationSharer order={order} />
        </div>
      )}

      {/* Message customer */}
      {order.customer_email && (
        <div className="mt-3 pt-3 border-t border-stone-100">
          <p className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1">
            <MessageSquareText className="w-3.5 h-3.5" /> Message customer
          </p>
          <div className="flex gap-2">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="e.g. Your order will come at 5:00 PM today"
              className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !msg.trim()}
              className="rounded-xl bg-stone-900 text-white px-3 py-2 text-sm flex items-center gap-1 disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </button>
          </div>
        </div>
      )}

      {/* Delivery proof */}
      <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-3 flex-wrap">
        <p className="text-xs font-semibold text-stone-700 flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5" /> Delivery proof
        </p>
        {order.delivery_proof_url ? (
          <a href={order.delivery_proof_url} target="_blank" rel="noreferrer">
            <img src={order.delivery_proof_url} alt="Delivery proof" className="w-16 h-16 rounded-lg object-cover border border-stone-100" />
          </a>
        ) : (
          <label className="cursor-pointer text-xs text-stone-600 border border-stone-200 rounded-xl px-3 py-1.5 hover:bg-stone-50 flex items-center gap-1">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload photo
            <input type="file" accept="image/*" className="hidden" onChange={uploadProof} />
          </label>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-3">
        <div ref={qrWrapRef} className="bg-white p-1 rounded-lg border border-stone-100">
          <QRCodeCanvas
            value={`${window.location.origin}/Driver?order=${order.id}`}
            size={80}
            level="M"
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-stone-700 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5" /> Driver QR
          </p>
          <p className="text-[10px] text-stone-400 max-w-[200px]">
            The delivery person downloads this QR, then scans it with the camera on the Driver Delivery page.
          </p>
          <button
            onClick={downloadQr}
            className="mt-1 text-xs text-stone-700 border border-stone-200 rounded-lg px-2.5 py-1 flex items-center gap-1 hover:bg-stone-50"
          >
            <Download className="w-3.5 h-3.5" /> Download QR
          </button>
        </div>
      </div>
    </div>
  );
}