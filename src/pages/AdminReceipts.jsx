const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ArrowLeft, Receipt, Download, Printer, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import OrderReceipt from "@/components/store/OrderReceipt";

export default function AdminReceipts() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    db.auth.me().then(u => setIsAdmin(u?.role === "admin")).catch(() => setIsAdmin(false));
  }, []);

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["admin-receipts"],
    queryFn: () => db.entities.Receipt.list("-created_date", 500),
    enabled: isAdmin === true,
  });

  if (isAdmin === null) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-stone-400" /></div>;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center"><p className="text-stone-500">Access denied.</p></div>;

  const filtered = receipts.filter(r => {
    const q = search.toLowerCase();
    return !q || r.customer_name?.toLowerCase().includes(q) || r.customer_email?.toLowerCase().includes(q) || r.order_id?.toLowerCase().includes(q) || r.city?.toLowerCase().includes(q);
  });

  const exportCSV = () => {
    const rows = [
      ["Order ID", "Date", "Customer", "Email", "City", "Payment", "Subtotal", "Discount", "Shipping", "Total", "Promo", "Items"].join(","),
      ...filtered.map(r => [
        r.order_id,
        r.created_date ? format(new Date(r.created_date), "yyyy-MM-dd HH:mm") : "",
        `"${(r.customer_name || "").replace(/"/g, '""')}"`,
        r.customer_email || "",
        r.city || "",
        r.payment_method || "",
        r.subtotal ?? "",
        r.discount ?? "",
        r.shipping_cost ?? "",
        r.total ?? "",
        r.promo_used || "",
        `"${(r.items || []).map(i => `${i.product_name} x${i.quantity}`).join("; ").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipts-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Link to={createPageUrl("AdminOrders")} className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">All Receipts</h1>
            <p className="text-stone-500 text-sm mt-1">{filtered.length} receipts · SAR {filtered.reduce((s, r) => s + (r.total || 0), 0).toFixed(2)} total</p>
          </div>
          <Button variant="outline" className="rounded-xl gap-2" onClick={exportCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input placeholder="Search by name, email, city, order ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-stone-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Receipt className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No receipts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const isExpanded = expandedId === r.id;
              // Build order object compatible with OrderReceipt component
              const orderForReceipt = {
                id: r.order_id || r.id,
                customer_name: r.customer_name,
                customer_email: r.customer_email,
                items: r.items,
                subtotal: r.subtotal,
                discount: r.discount,
                shipping_cost: r.shipping_cost,
                total: r.total,
                city: r.city,
                address: r.shipping_address,
                shipping_address: r.shipping_address,
                payment_method: r.payment_method,
                promo_used: r.promo_used,
                notes: r.notes,
                placedAt: r.created_date,
              };

              return (
                <div key={r.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                  {/* Summary row */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-stone-400">#{(r.order_id || "").slice(-8)}</span>
                          <Badge variant="outline" className="text-xs bg-stone-50 text-stone-600 border-stone-200">{r.payment_method === "instapay" ? "📱 InstaPay" : "💵 Cash"}</Badge>
                          {r.promo_used && <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">🏷️ {r.promo_used}</span>}
                        </div>
                        <p className="font-semibold text-stone-900 mt-1">{r.customer_name || "—"}</p>
                        <p className="text-xs text-stone-400">{r.customer_email}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{r.created_date ? format(new Date(r.created_date), "MMM d, yyyy · h:mm a") : "—"}</p>
                        {r.city && <p className="text-xs text-stone-400">📍 {r.city}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-stone-900 text-lg">SAR {(r.total || 0).toFixed(2)}</p>
                        {r.discount > 0 && <p className="text-xs text-emerald-600">−SAR {r.discount.toFixed(2)} off</p>}
                        <p className="text-xs text-stone-400">Ship: {r.shipping_cost === 0 ? "Free" : `SAR ${(r.shipping_cost || 0).toFixed(2)}`}</p>
                      </div>
                    </div>
                    <div className="space-y-1 border-t border-stone-100 pt-3 mb-3">
                      {(r.items || []).map((item, j) => (
                        <div key={j} className="flex justify-between text-sm">
                          <span className="text-stone-600">{item.product_name} ×{item.quantity}</span>
                          <span className="text-stone-700">SAR {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {r.notes && <p className="text-xs text-stone-400 mb-3">📝 {r.notes}</p>}

                    {/* Toggle full receipt */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="w-full flex items-center justify-center gap-2 text-xs text-stone-500 hover:text-stone-800 border border-stone-200 rounded-xl py-2 transition-colors"
                    >
                      {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide Full Receipt</> : <><ChevronDown className="w-3.5 h-3.5" /> View & Print Full Receipt</>}
                    </button>
                  </div>

                  {/* Full tall receipt */}
                  {isExpanded && (
                    <div className="border-t border-stone-100 bg-stone-50 px-4 py-6">
                      <OrderReceipt order={orderForReceipt} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}