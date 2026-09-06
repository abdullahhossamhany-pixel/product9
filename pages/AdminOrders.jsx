const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminOrderRow from "@/components/admin/AdminOrderRow";
import { Loader2, ClipboardList, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminOrders() {
  const [isAdmin, setIsAdmin] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await db.auth.me();
        setIsAdmin(user.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => db.entities.Order.list("-created_date"),
    enabled: isAdmin === true,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const order = orders.find(o => o.id === id);
      if ((status === "cancelled" || status === "delivered") && order) {
        await db.entities.OrderHistory.create({
          customer_email: order.customer_email,
          customer_name: order.customer_name,
          items: order.items,
          total: order.total,
          status,
          payment_method: order.payment_method,
          shipping_address: order.shipping_address,
          city: order.notes?.match(/City:\s*([^|]+)/)?.[1]?.trim() || "",
          shipping_cost: 0,
          notes: order.notes,
          promo_used: order.notes?.match(/Promos:\s*([^|]+)/)?.[1]?.trim() || "",
        });
        return db.entities.Order.delete(id);
      }
      return db.entities.Order.update(id, { status });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      if (status === "cancelled") toast.success("Order cancelled");
      else if (status === "delivered") toast.success("Order delivered");
      else toast.success("Order updated");
    },
  });

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <EyeOff className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Access Denied</h2>
        <p className="text-stone-500">Only administrators can view orders.</p>
        <Button onClick={() => navigate(createPageUrl("Store"))} variant="outline" className="rounded-xl mt-2">
          Go to Store
        </Button>
      </div>
    );
  }

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Orders</h1>
            <p className="text-stone-500 mt-1">
              {orders.length} total{pendingCount > 0 && ` · ${pendingCount} pending`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 text-lg">No orders yet</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {orders.map((order) => (
              <AdminOrderRow
                key={order.id}
                order={order}
                onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}