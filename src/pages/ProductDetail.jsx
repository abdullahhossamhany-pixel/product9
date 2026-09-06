const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ArrowLeft, Minus, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ProductReviews from "@/components/store/ProductReviews";
import FrequentlyBought from "@/components/store/FrequentlyBought";

export default function ProductDetail() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  useEffect(() => {
    const load = async () => {
      if (!productId) return;
      const products = await db.entities.Product.list();
      const found = products.find((p) => p.id === productId);
      setProduct(found);
      setActiveImage(0);
      setSelectedVariant(found?.variants?.length ? found.variants[0] : null);
      setLoading(false);
    };
    load();
  }, [productId]);

  const playBeeps = (count) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.15);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.15);
    }
  };

  const effectiveStock = selectedVariant ? (selectedVariant.stock ?? product?.stock ?? 0) : (product?.stock ?? 0);

  const addToCart = () => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((i) => i.product_id === product.id && (i.variant || null) === (selectedVariant?.label || null));
    const currentQty = existing ? existing.quantity : 0;
    const newTotal = currentQty + qty;

    if (effectiveStock > 0 && newTotal > effectiveStock) {
      toast.error(`Only ${effectiveStock} available in stock`);
      return;
    }

    if (existing) {
      existing.quantity = newTotal;
    } else {
      cart.push({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: qty,
        image_url: selectedVariant?.image_url || product.image_url,
        variant: selectedVariant?.label || null,
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    playBeeps(newTotal);
    toast.success(`${product.name} added to cart`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
        <p className="text-stone-500">Product not found</p>
        <Link to={createPageUrl("Store")}>
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Store
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link to={createPageUrl("Store")} className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12"
        >
          <div>
            <div className="aspect-square rounded-3xl overflow-hidden bg-white border border-stone-100">
              {(() => {
                const imgs = product.image_urls?.length ? product.image_urls : (product.image_url ? [product.image_url] : []);
                return (selectedVariant?.image_url) ? (
                  <motion.img
                    key={selectedVariant.image_url}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={selectedVariant.image_url}
                    alt={`${product.name} - ${selectedVariant.label}`}
                    className="w-full h-full object-cover"
                  />
                ) : imgs.length > 0 ? (
                  <motion.img
                    key={activeImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={imgs[activeImage] || imgs[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <ShoppingBag className="w-24 h-24" />
                  </div>
                );
              })()}
            </div>
            {(product.image_urls?.length > 1) && (
              <div className="flex gap-3 mt-4">
                {product.image_urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveImage(i); setSelectedVariant(null); }}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                      !selectedVariant && activeImage === i ? "border-stone-900" : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <img src={url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {(product.variants?.length > 0) && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-stone-700 mb-2">Choose an option:</p>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v, i) => {
                    const vStock = v.stock ?? product?.stock ?? 0;
                    const out = vStock <= 0;
                    const selected = selectedVariant?.label === v.label;
                    return (
                      <button
                        key={i}
                        disabled={out}
                        onClick={() => { if (!out) { setSelectedVariant(v); setQty(1); } }}
                        className={`flex flex-col items-center gap-1.5 ${out ? "opacity-50 cursor-not-allowed" : "group"}`}
                      >
                        <div className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                          selected ? "border-stone-900" : out ? "border-stone-200" : "border-stone-200 group-hover:border-stone-400"
                        }`}>
                          {v.image_url
                            ? <img src={v.image_url} alt={v.label} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-stone-300"><ShoppingBag className="w-6 h-6" /></div>}
                        </div>
                        <span className={`text-xs font-medium ${selected ? "text-stone-900" : "text-stone-500"}`}>
                          {v.label}
                        </span>
                        <span className={`text-[10px] font-medium ${out ? "text-red-500" : selected ? "text-emerald-600" : "text-stone-400"}`}>
                          {out ? "No stock" : `${vStock} in stock`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <Badge variant="outline" className="w-fit mb-3 text-xs uppercase tracking-widest text-stone-500 border-stone-200 rounded-full px-3">
              {product.category?.replace(/_/g, " ") || "Product"}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 leading-tight">{product.name}</h1>
            <p className="text-3xl font-bold text-stone-900 mt-4">SAR {product.price?.toFixed(2)}</p>

            {product.description && (
              <p className="text-stone-500 mt-6 leading-relaxed text-lg">{product.description}</p>
            )}

            <div className="mt-8">
              <p className="text-sm text-stone-500 mb-2">
                {effectiveStock > 0 ? (
                  <span className="text-emerald-600">{effectiveStock} in stock</span>
                ) : (
                  <span className="text-red-500">Out of stock</span>
                )}
              </p>

              <div className="flex items-center gap-4">
                <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-3 py-2.5 hover:bg-stone-50 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2.5 font-medium text-center min-w-[48px]">{qty}</span>
                  <button
                    onClick={() => setQty(effectiveStock > 0 ? Math.min(effectiveStock, qty + 1) : qty + 1)}
                    className="px-3 py-2.5 hover:bg-stone-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  onClick={addToCart}
                  disabled={effectiveStock <= 0}
                  className="flex-1 bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-12 text-base font-medium"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <ProductReviews productId={productId} />
        <FrequentlyBought productId={productId} currentProduct={product} />
      </div>
    </div>
  );
}