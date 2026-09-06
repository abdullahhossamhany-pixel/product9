const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShoppingBag, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function FrequentlyBought({ productId, currentProduct }) {
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => db.entities.Product.list(),
  });
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["order-history-fbt"],
    queryFn: () => db.entities.OrderHistory.list("-created_date", 400),
  });

  const recommendations = useMemo(() => {
    const counts = {};
    orders.forEach((o) => {
      const items = o.items || [];
      if (!items.some((i) => i.product_id === productId)) return;
      items.forEach((i) => {
        if (i.product_id && i.product_id !== productId) {
          counts[i.product_id] = (counts[i.product_id] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => products.find((p) => p.id === id))
      .filter((p) => p && p.is_active !== false);
  }, [orders, products, productId]);

  if (loadingProducts || loadingOrders) {
    return (
      <div className="mt-10 pt-8 border-t border-stone-100">
        <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /> Frequently Bought Together</h3>
        <div className="flex items-center gap-2 text-stone-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Finding pairings…</div>
      </div>
    );
  }

  if (!recommendations.length) return null;

  const bundle = [currentProduct, ...recommendations].filter(Boolean);
  const bundlePrice = bundle.reduce((s, p) => s + (p.price || 0), 0);

  const addAllToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    bundle.forEach((p) => {
      if (!p?.id) return;
      const existing = cart.find((i) => i.product_id === p.id && !i.variant);
      if (existing) existing.quantity += 1;
      else cart.push({
        product_id: p.id,
        product_name: p.name,
        price: p.price,
        quantity: 1,
        image_url: p.image_url || p.image_urls?.[0] || "",
        variant: null,
      });
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    toast.success("Bundle added to cart");
  };

  return (
    <div className="mt-10 pt-8 border-t border-stone-100">
      <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /> Frequently Bought Together</h3>
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {bundle.map((p, i) => (
          <React.Fragment key={p.id}>
            <Link to={`${createPageUrl("ProductDetail")}?id=${p.id}`} className="flex-shrink-0 w-28 group">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border border-stone-100 bg-white">
                {(p.image_url || p.image_urls?.[0]) ? (
                  <img src={p.image_url || p.image_urls[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300"><ShoppingBag className="w-8 h-8" /></div>
                )}
              </div>
              <p className="text-xs font-medium text-stone-700 mt-1.5 line-clamp-1">{p.name}</p>
              <p className="text-xs text-stone-500">SAR {p.price?.toFixed(2)}</p>
            </Link>
            {i < bundle.length - 1 && <span className="text-stone-300 font-bold">+</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
        <Button onClick={addAllToCart} className="rounded-xl bg-stone-900 hover:bg-stone-800">
          <ShoppingBag className="w-4 h-4 mr-2" /> Add bundle to cart
        </Button>
        <p className="text-sm text-stone-500">Bundle total: <b className="text-stone-900">SAR {bundlePrice.toFixed(2)}</b></p>
      </div>
    </div>
  );
}