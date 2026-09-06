const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Heart } from "lucide-react";
import { toast } from "sonner";

export default function WishlistButton({ product, user, saved }) {
  const [wished, setWished] = useState(saved);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setWished(saved); }, [saved]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.email) {
      db.auth.redirectToLogin();
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (wished) {
        const mine = await db.entities.Wishlist.filter({ customer_email: user.email, product_id: product.id });
        await Promise.all(mine.map((w) => db.entities.Wishlist.delete(w.id)));
        setWished(false);
      } else {
        await db.entities.Wishlist.create({ customer_email: user.email, product_id: product.id });
        setWished(true);
        toast.success("Saved to wishlist ❤️");
      }
    } catch {
      toast.error("Couldn't update wishlist");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
      className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-sm border transition-all ${
        wished
          ? "bg-red-50 border-red-200 text-red-500"
          : "bg-white/90 border-stone-200 text-stone-400 hover:text-red-500"
      }`}
    >
      <Heart className={`w-4 h-4 ${wished ? "fill-red-500" : ""}`} />
    </button>
  );
}