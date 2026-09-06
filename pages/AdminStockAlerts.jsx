const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";

const LOW_STOCK_THRESHOLD = 5;

export default function AdminStockAlerts() {
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { db.auth.me().then(setUser).catch(() => {}); }, []);
  const isAdmin = user?.role === "admin";

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => db.entities.Product.list("-created_date"),
    enabled: !!isAdmin,
  });

  const { data: existingNotifs = [] } = useQuery({
    queryKey: ["admin-notifs-stock"],
    queryFn: () => db.entities.Notification.filter({ type: "general" }),
    enabled: !!isAdmin,
  });

  const lowStock = products.filter((p) => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD);

  // Generate low-stock notifications for the admin (deduplicated by message text).
  const notifyAll = async () => {
    try {
      const existing = new Set(existingNotifs.map((n) => n.message));
      let created = 0;
      for (const p of lowStock) {
        const msg = `Low stock: ${p.name} (${p.stock ?? 0} left)`;
        if (existing.has(msg)) continue;
        await db.entities.Notification.create({ message: msg, type: "general" });
        existing.add(msg);
        created++;
      }
      toast.success(created > 0 ? `${created} stock alert(s) added to your notifications` : "No new low-stock items to notify");
      qc.invalidateQueries({ queryKey: ["admin-notifs-stock"] });
    } catch {
      toast.error("Could not create alerts");
    }
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-stone-500">Admins only</div>;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-stone-900 mb-1 flex items-center gap-2"><AlertTriangle className="w-7 h-7 text-amber-500" /> Low Stock Alerts</h1>
        <p className="text-stone-500 mb-6">Products at or below {LOW_STOCK_THRESHOLD} units. Send these to your notifications so you never run out.</p>

        <Button onClick={notifyAll} className="rounded-xl bg-stone-900 hover:bg-stone-800 mb-6"><Bell className="w-4 h-4 mr-2" /> Notify me of all low stock</Button>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-stone-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : lowStock.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center text-stone-400">All products are well stocked 🎉</div>
        ) : (
          <div className="space-y-3">
            {lowStock.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-900">{p.name}</p>
                  <p className="text-sm text-stone-500">{p.category || "Uncategorized"}</p>
                </div>
                <Badge className={p.stock === 0 ? "bg-red-100 text-red-700 border-0" : "bg-amber-100 text-amber-700 border-0"}>
                  {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}