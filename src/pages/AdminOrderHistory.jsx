const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ArrowLeft, Package, Trash2, Download } from "lucide-react";
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

export default function AdminOrderHistory() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    db.auth.me().then(u => setIsAdmin(u?.role === "admin")).catch(() => setIsAdmin(false));
  }, []);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-order-history"],
    queryFn: () => db.entities.OrderHistory.list("-created_date", 200),
    enabled: isAdmin === true,
  });

  const handleDelete = async (id) => {
    if (!confirm("Delete this order history record?")) return;
    await db.entities.OrderHistory.delete(id);
    refetch();
  };

  if (isAdmin === null) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-stone-500">Access denied.</p>
    </div>
  );

  const statuses = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"];

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_email?.toLowerCase().includes(q) ||
      o.id?.toLowerCase().includes(q) ||
      o.city?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalRevenue = filtered.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link to={createPageUrl("AdminOrders")} className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-stone-900">Order History</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-xl gap-2"
              onClick={() => {
                const rows = [
                  ["ID", "Date", "Customer Name", "Email", "City", "Status", "Payment", "Items", "Shipping", "Total", "Promo", "Notes"].join(","),
                  ...filtered.map(o => [
                    o.id,
                    o.created_date ? format(new Date(o.created_date), "yyyy-MM-dd HH:mm") : "",
                    `"${(o.customer_name || "").replace(/"/g, '""')}"`,
                    o.customer_email || "",
                    o.city || "",
                    o.status || "",
                    o.payment_method || "",
                    `"${(o.items || []).map(i => `${i.product_name} x${i.quantity}`).join("; ").replace(/"/g, '""')}"`,
                    o.shipping_cost ?? "",
                    o.total ?? "",
                    o.promo_used || "",
                    `"${(o.notes || "").replace(/"/g, '""')}"`
                  ].join(","))
                ].join("\n");
                const blob = new Blob([rows], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `order-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <div className="text-right">
              <p className="text-sm text-stone-500">{filtered.length} orders</p>
              <p className="font-bold text-stone-900">SAR {totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search by name, email, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                  statusFilter === s ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-stone-100 p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-stone-400">#{(order.id || "").slice(-8)}</span>
                      <Badge variant="outline" className={`text-xs ${statusColors[order.status] || statusColors.pending}`}>
                        {order.status || "pending"}
                      </Badge>
                      {order.promo_used && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                          🏷️ {order.promo_used}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-stone-900 mt-1">{order.customer_name || "—"}</p>
                    <p className="text-xs text-stone-400">{order.customer_email}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {order.created_date ? format(new Date(order.created_date), "MMM d, yyyy · h:mm a") : "—"}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-right">
                      <p className="font-bold text-stone-900">SAR {order.total?.toFixed(2)}</p>
                      {order.city && <p className="text-xs text-stone-400">📍 {order.city}</p>}
                      {order.shipping_cost > 0 && <p className="text-xs text-stone-400">Delivery: SAR {order.shipping_cost?.toFixed(2)}</p>}
                      <p className="text-xs text-stone-400">{order.payment_method === "visa" ? "💳 Visa" : "💵 Cash"}</p>
                    </div>
                    <button onClick={() => handleDelete(order.id)} className="text-stone-300 hover:text-red-500 transition-colors mt-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 mb-2">
                  {(order.items || []).map((item, j) => (
                    <div key={j} className="flex justify-between text-sm">
                      <span className="text-stone-600">{item.product_name} ×{item.quantity}</span>
                      <span className="text-stone-700">SAR {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.shipping_address && (
                  <p className="text-xs text-stone-400 border-t border-stone-100 pt-2 mt-2">
                    📦 {order.shipping_address}
                  </p>
                )}
                {order.notes && (
                  <p className="text-xs text-stone-400 mt-1">📝 {order.notes}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}