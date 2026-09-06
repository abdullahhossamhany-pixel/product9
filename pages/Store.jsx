const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/store/ProductCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import StockBanner from "@/components/store/StockBanner";
import AdminMessageBanner from "@/components/store/AdminMessageBanner";

export default function Store() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isBanned, setIsBanned] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const { data: personalPromos = [] } = useQuery({
    queryKey: ["personal-promo", currentUser?.email],
    queryFn: () => db.entities.PromoCode.filter({ target_email: currentUser.email, is_active: true }),
    enabled: !!currentUser?.email,
  });
  const personalPromo = personalPromos[0];

  const { data: myWishlist = [] } = useQuery({
    queryKey: ["wishlist", currentUser?.email],
    queryFn: () => db.entities.Wishlist.filter({ customer_email: currentUser.email }),
    enabled: !!currentUser?.email,
  });
  const wishedIds = new Set(myWishlist.map((w) => w.product_id));

  React.useEffect(() => {
    db.auth.me().then(async (u) => {
      if (u) {
        setCurrentUser(u);
        const banned = await db.entities.User.filter({ is_banned: true });
        if (banned.some((b) => b.email === u.email)) setIsBanned(true);
      }
    }).catch(() => {});
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => db.entities.Product.list("-created_date")
  });

  const activeProducts = products
    .filter((p) => p.is_active !== false)
    .map((p) => ({ ...p, _wished: wishedIds.has(p.id) }));

  const { data: categoryList = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => db.entities.Category.list("name")
  });

  const CATEGORIES = [
  { value: "all", label: "All" },
  ...categoryList.filter((c) => c.is_active !== false).map((c) => ({ value: c.name, label: c.name.charAt(0).toUpperCase() + c.name.slice(1) }))];

  const filtered = activeProducts.filter((p) => {
    const matchSearch =
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || p.category === category;
    return matchSearch && matchCategory;
  });

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

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((i) => i.product_id === product.id);
    const currentQty = existing ? existing.quantity : 0;

    if (product.stock > 0 && currentQty >= product.stock) {
      toast.error(`Only ${product.stock} available in stock`);
      return;
    }

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        image_url: product.image_url
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    playBeeps(1);
    toast.success(`${product.name} added to cart`);
  };

  if (isBanned) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-6xl">🚫</div>
        <h2 className="text-2xl font-bold text-stone-900">Account Banned</h2>
        <p className="text-stone-500 text-center">Your account has been banned. Please contact support if you believe this is a mistake.</p>
        <a href="tel:+201101096853" className="text-stone-700 font-semibold hover:underline">Contact: +20 11 01096853</a>
      </div>);

  }

  return (
    <div className="min-h-screen bg-stone-50">
      <StockBanner />
      <AdminMessageBanner email={currentUser?.email} />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-amber-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-stone-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}>
            
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-medium text-amber-400 uppercase tracking-widest">
                Curated Collection
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Discover Something
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
                Extraordinary
              </span>
            </h1>
            <p className="mt-4 text-stone-400 text-lg max-w-lg">Handpicked products crafted with care. Browse our exclusive collection.

            </p>
            {personalPromo && (
              <div className="mt-5 inline-flex flex-wrap items-center gap-2 bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-2.5">
                <span className="text-amber-300 font-bold text-sm">🎁 A gift just for you, {currentUser?.full_name?.split(" ")[0] || ""}! Use code</span>
                <span className="font-mono font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded">{personalPromo.code}</span>
                <span className="text-amber-300 font-bold text-sm">— {personalPromo.label}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg shadow-stone-200/50 border border-stone-100 p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl border-stone-200 h-11" />
            
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) =>
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              category === c.value ?
              "bg-stone-900 text-white shadow-md" :
              "bg-stone-100 text-stone-600 hover:bg-stone-200"}`
              }>
              
                {c.label}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ?
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
          </div> :
        filtered.length === 0 ?
        <div className="text-center py-20">
            <p className="text-stone-400 text-lg">No products found</p>
          </div> :

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((product, i) =>
            <ProductCard key={product.id} product={product} index={i} user={currentUser} onAddToCart={addToCart} />
            )}
            </AnimatePresence>
          </div>
        }
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-stone-200 mt-4">
        <a
          href="https://abou-us-page.lovable.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors mb-4">
          
          About Us
        </a>
        <p className="text-stone-500 text-sm">📞 Contact us: <a href="tel:+201101096853" className="font-semibold text-stone-800 hover:underline">+20 11 01096853</a></p>
      </div>
    </div>);

}