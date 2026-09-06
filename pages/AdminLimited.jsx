const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingBag, EyeOff, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminLimited() {
  const [isAdmin, setIsAdmin] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me()
      .then(u => setIsAdmin(u?.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-limited-products"],
    queryFn: () => db.entities.Product.list("-created_date"),
    enabled: isAdmin === true,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, is_limited }) => db.entities.Product.update(id, { is_limited }),
    onSuccess: (_, { is_limited }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-limited-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(is_limited ? "✨ Product marked as Limited Edition!" : "Product is no longer limited");
    },
  });

  if (isAdmin === null) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <EyeOff className="w-10 h-10 text-red-400" />
      <h2 className="text-xl font-bold">Access Denied</h2>
      <Button onClick={() => navigate(createPageUrl("Store"))} variant="outline" className="rounded-xl">
        Go to Store
      </Button>
    </div>
  );

  const limitedProducts = products.filter(p => p.is_limited);
  const normalProducts = products.filter(p => !p.is_limited);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h1 className="text-3xl font-bold text-stone-900">Limited Edition</h1>
          </div>
          <p className="text-stone-500">Toggle which products are marked as Limited Edition</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Limited Products */}
            {limitedProducts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
                  ✨ Currently Limited ({limitedProducts.length})
                </h2>
                <div className="space-y-3">
                  {limitedProducts.map(product => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onToggle={() => updateMutation.mutate({ id: product.id, is_limited: false })}
                      isLimited
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Normal Products */}
            <div>
              <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
                All Products ({normalProducts.length})
              </h2>
              {normalProducts.length === 0 ? (
                <p className="text-stone-400 text-sm py-6 text-center">All products are limited!</p>
              ) : (
                <div className="space-y-3">
                  {normalProducts.map(product => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onToggle={() => updateMutation.mutate({ id: product.id, is_limited: true })}
                      isLimited={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProductRow({ product, onToggle, isLimited }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-all ${
        isLimited ? "rainbow-glow" : "border-stone-100"
      }`}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-50 flex-shrink-0">
        {product.image_url ? (
          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <ShoppingBag className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-stone-900 truncate">{product.name}</h3>
          {isLimited && (
            <span className="text-xs font-bold rainbow-text uppercase tracking-wider">LIMITED</span>
          )}
        </div>
        <p className="text-sm text-stone-500 mt-0.5">SAR {product.price?.toFixed(2)} · Stock: {product.stock ?? 0}</p>
      </div>
      <Button
        onClick={onToggle}
        size="sm"
        variant={isLimited ? "outline" : "default"}
        className={`rounded-xl flex-shrink-0 ${!isLimited ? "bg-stone-900 hover:bg-stone-800" : ""}`}
      >
        {isLimited ? "Remove Limited" : "✨ Make Limited"}
      </Button>
    </motion.div>
  );
}