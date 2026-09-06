const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, ShoppingBag } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Wishlist() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    db.auth.me().then((u) => setUser(u)).catch(() => {});
  }, []);

  const { data: wishlisted = [], isLoading } = useQuery({
    queryKey: ["wishlist", user?.email],
    queryFn: () => db.entities.Wishlist.filter({ customer_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => db.entities.Product.list(),
  });

  const savedProducts = wishlisted
    .map((w) => products.find((p) => p.id === w.product_id))
    .filter(Boolean)
    .filter((p) => p.is_active !== false);

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((i) => i.product_id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        image_url: product.image_url,
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    toast.success(`${product.name} added to cart`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center">
        <Heart className="w-12 h-12 text-stone-300 mb-4" />
        <h2 className="text-xl font-bold text-stone-900 mb-2">Sign in to see your wishlist</h2>
        <Button className="mt-4 bg-stone-900 rounded-xl" onClick={() => db.auth.redirectToLogin()}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-stone-900 mb-2 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" /> My Wishlist
        </h1>
        <p className="text-stone-500 mb-8">{savedProducts.length} saved item{savedProducts.length === 1 ? "" : "s"}</p>

        {isLoading ? (
          <div className="text-stone-400">Loading…</div>
        ) : savedProducts.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 text-lg">Your wishlist is empty</p>
            <Link to={createPageUrl("Store")}>
              <Button className="mt-6 bg-stone-900 hover:bg-stone-800 rounded-xl">
                <ShoppingBag className="w-4 h-4 mr-2" /> Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} user={user} onAddToCart={addToCart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}