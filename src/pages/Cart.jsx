const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef, useCallback } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import CartItem from "@/components/store/CartItem";
import LocationPicker, { isLocationComplete } from "@/components/store/LocationPicker";
import FulfillmentSelector from "@/components/store/FulfillmentSelector";
import { ShoppingBag, ArrowLeft, Loader2, CheckCircle, Tag, X, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import OrderReceipt from "@/components/store/OrderReceipt";
import TipSelector from "@/components/store/TipSelector";
import SpendVerificationGate from "@/components/store/SpendVerificationGate";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", notes: "" });
  const [delivery, setDelivery] = useState({});
  const [fulfillment, setFulfillment] = useState({ mode: "delivery", scheduledDate: "" });
  const [addressExtraCost, setAddressExtraCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromos, setAppliedPromos] = useState([]);
  const [promoError, setPromoError] = useState("");
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [orderSummary, setOrderSummary] = useState(null);
  const [placedOrderData, setPlacedOrderData] = useState(null);
  const [useStoreWallet, setUseStoreWallet] = useState(false);
  const [showSpendVerify, setShowSpendVerify] = useState(false);
  const receiptRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    db.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser) {
      setForm((f) => ({
        ...f,
        name: f.name || currentUser.full_name || "",
        email: f.email || currentUser.email || ""
      }));
    }
  }, [currentUser]);

  const { data: promoCodes = [] } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: () => db.entities.PromoCode.list()
  });

  const { data: usedCodes = [] } = useQuery({
    queryKey: ["used-promo-codes", currentUser?.email],
    queryFn: () => db.entities.UsedPromoCode.filter({ customer_email: currentUser.email }),
    enabled: !!currentUser?.email
  });

  const { data: pastOrders = [] } = useQuery({
    queryKey: ["customer-past-orders", currentUser?.email],
    queryFn: () => db.entities.OrderHistory.filter({ customer_email: currentUser.email }),
    enabled: !!currentUser?.email
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ["gift-wallet", currentUser?.email],
    queryFn: () => db.entities.GiftCardWallet.filter({ customer_email: currentUser.email }),
    enabled: !!currentUser?.email
  });
  const walletBalance = wallets[0]?.balance || 0;
  const [useWallet, setUseWallet] = useState(false);

  const { data: storeWallets = [] } = useQuery({
    queryKey: ["customer-store-wallet", currentUser?.email],
    queryFn: () => db.entities.CustomerWallet.filter({ customer_email: currentUser.email }),
    enabled: !!currentUser?.email
  });
  const storeWalletBalance = storeWallets[0]?.balance || 0;

  const { data: myFamilyMember = [] } = useQuery({
    queryKey: ["my-family-member", currentUser?.email],
    queryFn: () => db.entities.FamilyMember.filter({ child_email: currentUser.email, status: "active" }),
    enabled: !!currentUser?.email,
  });
  const childMember = myFamilyMember[0];
  const _todayStr = new Date().toISOString().slice(0, 10);
  const _monthStr = _todayStr.slice(0, 7);
  let limitCap = Infinity;
  let spentUsed = 0;
  if (childMember) {
    if (childMember.limit_type === "daily") {
      spentUsed = (childMember.last_reset_date?.slice(0, 10) === _todayStr) ? (childMember.spent_today || 0) : 0;
      limitCap = childMember.daily_limit || 0;
    } else if (childMember.limit_type === "monthly") {
      spentUsed = (childMember.last_reset_date?.slice(0, 7) === _monthStr) ? (childMember.spent_this_month || 0) : 0;
      limitCap = childMember.monthly_limit || 0;
    }
  }
  const remainingLimit = limitCap - spentUsed;

  const { data: spendUnlocks = [], refetch: refetchSpendUnlock } = useQuery({
    queryKey: ["spend-unlock", currentUser?.email],
    queryFn: () => db.entities.SpendUnlock.filter({ customer_email: currentUser.email }),
    enabled: !!currentUser?.email,
  });
  const spendUnlocked = spendUnlocks.some((u) => u.unlocked_until && new Date(u.unlocked_until) > new Date());

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => db.entities.Product.list()
  });

  const getStock = (productId, variant, isGiftCard) => {
    if (isGiftCard) return 1;
    const p = products.find((p) => p.id === productId);
    if (!p) return Infinity;
    if (variant) {
      const v = p.variants?.find((v) => v.label === variant);
      return v?.stock ?? Infinity;
    }
    return p.stock ?? Infinity;
  };

  const isPickup = fulfillment.mode === "pickup";
  const baseShipping = isPickup ? 0 : (delivery.shippingCost || 0);

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (appliedPromos.find((p) => p.code === code)) {
      setPromoError("This code is already applied");
      return;
    }
    const found = promoCodes.find((p) => p.code === code && p.is_active !== false);
    const myUses = usedCodes.filter((u) => u.code === code).length;
    if (currentUser?.email && found?.max_uses_per_user && myUses >= found.max_uses_per_user) {
      setPromoError(`You have used this code the maximum (${found.max_uses_per_user}) times`);
      return;
    }
    if (currentUser?.email && !found?.max_uses_per_user && usedCodes.some((u) => u.code === code)) {
      setPromoError("You have already used this promo code");
      return;
    }
    if (found?.new_customers_only && (!currentUser?.email || pastOrders.length > 0)) {
      setPromoError("This code is only for new customers");
      return;
    }
    if (found?.target_email && found.target_email !== currentUser?.email) {
      setPromoError("This promo code was issued to a different account");
      return;
    }
    if (found) {
      setAppliedPromos((prev) => [...prev, { code: found.code, type: found.discount_type, value: found.discount_value || 0, label: found.label, id: found.id }]);
      setPromoError("");
      setPromoInput("");
      toast.success(`Promo code "${code}" applied!`);
    } else {
      setPromoError("Invalid or inactive promo code");
    }
  };

  const removePromo = (code) => {
    setAppliedPromos((prev) => prev.filter((p) => p.code !== code));
    setPromoError("");
  };

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
  }, []);

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cart-updated"));
  };

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

  const updateQty = (productId, variant, qty) => {
    if (qty <= 0) {
      removeItem(productId, variant);
      return;
    }
    const newCart = cart.map((i) =>
    i.product_id === productId && (i.variant || null) === (variant || null) ? { ...i, quantity: qty } : i
    );
    updateCart(newCart);
    playBeeps(1);
  };

  const removeItem = (productId, variant) => {
    updateCart(cart.filter((i) => !(i.product_id === productId && (i.variant || null) === (variant || null))));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = appliedPromos.reduce((sum, promo) => {
    if (promo.type === "percent") return sum + subtotal * (promo.value / 100);
    if (promo.type === "fixed") return sum + (promo.value || 0);
    return sum;
  }, 0);
  const hasFreeShipping = appliedPromos.some((p) => p.type === "shipping");
  const shipping = isPickup ? 0 : (hasFreeShipping ? 0 : baseShipping);
  const preGiftTotal = Math.max(0, subtotal - discount + shipping + tip);
  const giftCardApplied = useWallet ? Math.min(walletBalance, preGiftTotal) : 0;
  const storeWalletApplied = useStoreWallet ? Math.min(storeWalletBalance, preGiftTotal - giftCardApplied) : 0;
  const total = preGiftTotal - giftCardApplied - storeWalletApplied;
  const locationReady = isPickup || isLocationComplete(delivery);

  const handleCheckout = async (e) => {
    e.preventDefault();
    // Create + resume the audio context inside the user gesture so the
    // confirmation sound actually plays on mobile/tablets (iOS Safari keeps
    // it suspended until a gesture resumes it).
    let audioCtx = null;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch {}
    setSubmitting(true);
    try {
      if ((giftCardApplied > 0 || storeWalletApplied > 0) && !spendUnlocked) {
        toast.error("Verify your email to spend your wallet or gift card balance");
        setShowSpendVerify(true);
        setSubmitting(false);
        return;
      }
      if ((giftCardApplied > 0 || storeWalletApplied > 0) && !spendUnlocked) {
        toast.error("Verify your email to spend your wallet or gift card balance");
        setShowSpendVerify(true);
        setSubmitting(false);
        return;
      }

      if (childMember) {
        if ((childMember.balance || 0) < total) {
          toast.error("Not enough family wallet balance. Ask your parent for money.");
          setSubmitting(false);
          return;
        }
        if (childMember.limit_type === "daily" && total > remainingLimit) {
          toast.error(`This order exceeds your daily limit of SAR ${(childMember.daily_limit || 0).toFixed(2)} (remaining SAR ${Math.max(0, remainingLimit).toFixed(2)})`);
          setSubmitting(false);
          return;
        }
        if (childMember.limit_type === "monthly" && total > remainingLimit) {
          toast.error(`This order exceeds your monthly limit of SAR ${(childMember.monthly_limit || 0).toFixed(2)} (remaining SAR ${Math.max(0, remainingLimit).toFixed(2)})`);
          setSubmitting(false);
          return;
        }
      }

      let user = null;
      try {
        user = await db.auth.me();
      } catch {}

      // Check if user is banned
      if (user) {
        const freshUser = await db.entities.User.filter({ is_banned: true });
        if (freshUser.some((u) => u.email === user.email)) {
          toast.error("Your account has been banned. You cannot place orders.");
          setSubmitting(false);
          return;
        }
      }

      const customerEmail = form.email || user?.email;
      const customerName = form.name || user?.full_name;

      const giftCardItems = cart.filter((item) => item.is_gift_card);
      const giftCardNote = giftCardItems.length > 0
        ? ` | 🎁 Gift Card(s) Purchased: ${giftCardItems.map((i) => `${i.gift_card_code} (SAR ${i.price.toFixed(2)})`).join(", ")}`
        : "";

      const fullAddress = isPickup
        ? "Pickup at Villa O-18, Retal Compound"
        : (delivery.address || `${delivery.city || ""}, ${delivery.governorate || ""}`);
      const fulfillmentNote = isPickup
        ? "Pickup at Villa O-18, Retal Compound"
        : (fulfillment.scheduledDate ? `Scheduled delivery: ${fulfillment.scheduledDate} | ${delivery.city || ""}, ${delivery.governorate || ""}` : `${delivery.city || ""}, ${delivery.governorate || ""}`);
      const order = await db.entities.Order.create({
        customer_email: customerEmail,
        customer_name: customerName,
        items: cart,
        total,
        tip,
        status: "pending",
        payment_method: paymentMethod,
        shipping_address: fullAddress,
        scheduled_for: isPickup ? "" : (fulfillment.scheduledDate || ""),
        notes: fulfillmentNote + (form.notes ? ` | ${form.notes}` : "") + (appliedPromos.length > 0 ? ` | Promos: ${appliedPromos.map((p) => `${p.code} (${p.label})`).join(", ")}` : "") + (giftCardApplied > 0 ? ` | Gift Card Used: SAR ${giftCardApplied.toFixed(2)}` : "") + (storeWalletApplied > 0 ? ` | Store Wallet Used: SAR ${storeWalletApplied.toFixed(2)}` : "") + giftCardNote + ` | Payment: ${paymentMethod === "instapay" ? "InstaPay" : "Cash on Delivery"}`
      });

      await db.entities.Notification.create({
        message: `New order from ${customerName || customerEmail} — SAR ${total.toFixed(2)}` + (giftCardItems.length > 0 ? ` (includes gift card: ${giftCardItems.map((i) => i.gift_card_code).join(", ")})` : ""),
        type: "order",
        order_id: order.id
      });

      if (giftCardApplied > 0 && wallets[0]) {
        const newBalance = walletBalance - giftCardApplied;
        await db.entities.GiftCardWallet.update(wallets[0].id, { balance: newBalance });
        await db.entities.GiftCardTransaction.create({
          customer_email: customerEmail,
          type: "spend",
          amount: giftCardApplied,
          balance_after: newBalance,
          order_id: order.id
        });
      }

      // Deduct store wallet balance if used at checkout
      if (storeWalletApplied > 0 && storeWallets[0]) {
        const newStoreBalance = storeWalletBalance - storeWalletApplied;
        await db.entities.CustomerWallet.update(storeWallets[0].id, { balance: newStoreBalance });
      }

      // Decrease stock in parallel (skip gift card items — they aren't real products)
      // Also fire low-stock admin notifications when remaining stock falls at/below threshold.
      const LOW_STOCK_THRESHOLD = 5;
      await Promise.all(cart.filter((item) => !item.is_gift_card).map(async (item) => {
        const prods = await db.entities.Product.filter({ id: item.product_id });
        if (prods.length > 0) {
          const p = prods[0];
          if (item.variant) {
            let remainingVariantStock;
            const variants = (p.variants || []).map((v) => {
              if (v.label === item.variant) {
                remainingVariantStock = Math.max(0, (v.stock ?? 0) - item.quantity);
                return { ...v, stock: remainingVariantStock };
              }
              return v;
            });
            await db.entities.Product.update(item.product_id, { variants });
            if (remainingVariantStock <= LOW_STOCK_THRESHOLD) {
              await db.entities.Notification.create({
                message: `Low stock: ${p.name} (${item.variant}) — only ${remainingVariantStock} left`,
                type: "general",
              }).catch(() => {});
            }
          } else {
            const newStock = Math.max(0, (p.stock || 0) - item.quantity);
            await db.entities.Product.update(item.product_id, { stock: newStock });
            if (newStock <= LOW_STOCK_THRESHOLD) {
              await db.entities.Notification.create({
                message: `Low stock: ${p.name} — only ${newStock} left`,
                type: "general",
              }).catch(() => {});
            }
          }
        }
      }));

      // Mark the purchased gift cards as bought + pending manual delivery by the team
      await Promise.all(giftCardItems.map(async (gi) => {
        const found = await db.entities.GiftCard.filter({ code: gi.gift_card_code });
        if (found[0]) {
          await db.entities.GiftCard.update(found[0].id, {
            purchased_by_email: customerEmail,
            delivery_status: "pending",
          });
        }
      }));
      const generatedGiftCards = giftCardItems.map((gi) => ({ code: gi.gift_card_code, amount: gi.price }));

      // Award points: 50 per item + 1000 bonus if subtotal > 600
      const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
      const earnedPoints = itemCount * 50 + (subtotal > 600 ? 1000 : 0);
      try {
        const existing = await db.entities.Points.filter({ customer_email: customerEmail });
        if (existing.length > 0) {
          await db.entities.Points.update(existing[0].id, { points: (existing[0].points || 0) + earnedPoints });
        } else {
          await db.entities.Points.create({ customer_email: customerEmail, points: earnedPoints });
        }
      } catch {}

      // Save to OrderHistory entity
      await db.entities.OrderHistory.create({
        customer_email: customerEmail,
        customer_name: customerName,
        items: cart,
        total,
        tip,
        status: "pending",
        payment_method: paymentMethod,
        shipping_address: fullAddress,
        city: `${delivery.city || ""}, ${delivery.governorate || ""}`,
        shipping_cost: shipping,
        notes: form.notes,
        promo_used: appliedPromos.map((p) => p.code).join(", ")
      });

      // Record all used promo codes for this user (per-user one-time enforcement)
      await Promise.all(appliedPromos.map(async (promo) => {
        if (customerEmail) {
          await db.entities.UsedPromoCode.create({ customer_email: customerEmail, code: promo.code });
        }
      }));

      // Also fully deactivate one-time redeemed codes (from the Redeem/points section)
      await Promise.all(appliedPromos.map(async (promo) => {
        const found = await db.entities.PromoCode.filter({ code: promo.code, is_active: true, is_one_time: true });
        if (found.length > 0) {
          await db.entities.PromoCode.update(found[0].id, { is_active: false });
        }
      }));

      // Save receipt permanently
      await db.entities.Receipt.create({
        order_id: order.id,
        customer_name: customerName,
        customer_email: customerEmail,
        items: cart,
        subtotal,
        discount,
        shipping_cost: shipping,
        tip,
        total,
        city: `${delivery.city}, ${delivery.governorate}`,
        shipping_address: fullAddress,
        payment_method: paymentMethod,
        promo_used: appliedPromos.map((p) => p.code).join(", "),
        notes: form.notes,
        status: "pending"
      });

      // Save to localStorage order history
      const localHistory = JSON.parse(localStorage.getItem("order_history") || "[]");
      localHistory.unshift({
        id: order.id,
        customer_email: customerEmail,
        customer_name: customerName,
        items: cart,
        total,
        tip,
        status: "pending",
        payment_method: paymentMethod,
        shipping_address: fullAddress,
        city: `${delivery.city || ""}, ${delivery.governorate || ""}`,
        shipping_cost: shipping,
        placedAt: new Date().toISOString(),
        promo_used: appliedPromos.map((p) => p.code).join(", ")
      });
      localStorage.setItem("order_history", JSON.stringify(localHistory.slice(0, 50)));

      setOrderSummary({
        city: `${delivery.city || ""}, ${delivery.governorate || ""}`,
        shipping_cost: shipping,
        address: fullAddress,
        total,
        subtotal,
        discount,
        tip,
        customerName,
        appliedPromos: [...appliedPromos],
        generatedGiftCards
      });
      setPlacedOrderData({
        id: order.id,
        customer_name: customerName,
        customer_email: customerEmail,
        items: cart,
        total,
        subtotal,
        discount,
        shipping_cost: shipping,
        tip,
        address: fullAddress,
        city: delivery.city ? `${delivery.city}, ${delivery.governorate}` : delivery.governorate || "",
        payment_method: paymentMethod,
        appliedPromos: [...appliedPromos],
        placedAt: new Date().toISOString()
      });

      localStorage.setItem("cart", "[]");
      window.dispatchEvent(new Event("cart-updated"));

      if (childMember) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const patch = { balance: (childMember.balance || 0) - total };
        if (childMember.limit_type === "daily") {
          patch.spent_today = (childMember.last_reset_date?.slice(0, 10) === todayStr ? (childMember.spent_today || 0) : 0) + total;
          patch.last_reset_date = todayStr;
        } else if (childMember.limit_type === "monthly") {
          patch.spent_this_month = (childMember.last_reset_date?.slice(0, 7) === todayStr.slice(0, 7) ? (childMember.spent_this_month || 0) : 0) + total;
          patch.last_reset_date = todayStr;
        }
        try {
          await db.entities.FamilyMember.update(childMember.id, patch);
          qc.invalidateQueries({ queryKey: ["my-family-member", currentUser?.email] });
        } catch {}
      }

      // Play loud confirmation sound (guarded — mobile webviews may lock audio)
      try {
        const ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx && ctx.state === "suspended") { try { await ctx.resume(); } catch {} }
        const playBeep = (freq, start, duration) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.8, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + duration);
        };
        if (ctx) {
          playBeep(520, 0, 0.15);
          playBeep(660, 0.18, 0.15);
          playBeep(800, 0.36, 0.3);
        }
      } catch {}

      // emails disabled
      // Browser notification (guard: Notification is undefined in some mobile webviews,
      // and an unguarded access here used to abort the whole confirmation flow on mobile)
      const payLabel = paymentMethod === "instapay" ? "📱 InstaPay" : "💵 Cash on Delivery";
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Order Confirmed! 🎉", {
            body: `Thank you ${customerName}! Your order (SAR ${total.toFixed(2)}) was placed. Payment: ${payLabel}`,
            icon: "/favicon.ico"
          });
        } else if (typeof Notification !== "undefined" && Notification.permission !== "denied") {
          Notification.requestPermission().then((p) => {
            if (p === "granted") new Notification("Order Confirmed! 🎉", { body: `Thank you ${customerName}! Your order (SAR ${total.toFixed(2)}) was placed. Payment: ${payLabel}`, icon: "/favicon.ico" });
          }).catch(() => {});
        }
      } catch {}

      setOrderPlaced(true);
      setTimeout(() => receiptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full">
          
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Order Placed!</h2>
          <p className="text-stone-500 mb-6">
            Thank you{orderSummary?.customerName ? `, ${orderSummary.customerName}` : ""}! You'll receive updates on your order status.
          </p>

          {orderSummary &&
          <div className="bg-white rounded-2xl border border-stone-100 p-5 text-left mb-6 space-y-2">
              {/* City & Address */}
              <div className="flex items-start gap-2 pb-2 border-b border-stone-100">
                <span className="text-lg">📍</span>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{orderSummary.city}</p>
                  {orderSummary.address &&
                <p className="text-xs text-stone-500 mt-0.5">{orderSummary.address}</p>
                }
                </div>
              </div>

              {/* Promos / Redeemed codes */}
              {orderSummary.appliedPromos?.length > 0 &&
            <div className="pb-2 border-b border-stone-100">
                  <p className="text-xs font-semibold text-stone-500 mb-1.5">🎁 Redeemed Codes</p>
                  {orderSummary.appliedPromos.map((p) =>
              <div key={p.code} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 mb-1">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-sm font-mono font-bold text-emerald-800">{p.code}</span>
                      <span className="text-xs text-emerald-600">— {p.label}</span>
                    </div>
              )}
                </div>
            }

              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span>SAR {orderSummary.subtotal.toFixed(2)}</span>
              </div>
              {orderSummary.discount > 0 &&
            <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span>−SAR {orderSummary.discount.toFixed(2)}</span>
                </div>
            }
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Shipping</span>
                {orderSummary.shipping_cost === 0 ?
              <span className="text-emerald-600 font-medium">Free</span> :

              <span className="text-stone-700 font-medium">SAR {orderSummary.shipping_cost.toFixed(2)}</span>
              }
              </div>
              {orderSummary.tip > 0 &&
            <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Tip</span>
                  <span className="text-stone-700 font-medium">SAR {orderSummary.tip.toFixed(2)}</span>
                </div>
            }
              <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-100">
                <span>Total</span>
                <span>SAR {orderSummary.total.toFixed(2)}</span>
              </div>

              {orderSummary.generatedGiftCards?.length > 0 &&
            <div className="pt-3 mt-2 border-t border-stone-100">
                  <p className="text-xs font-semibold text-amber-700 mb-1.5">🎁 Thanks for buying {orderSummary.generatedGiftCards.length > 1 ? `${orderSummary.generatedGiftCards.length} gift cards` : "a gift card"}: SAR {orderSummary.generatedGiftCards.reduce((s, g) => s + g.amount, 0).toFixed(2)}. Our team will deliver {orderSummary.generatedGiftCards.length > 1 ? "them" : "it"} to you soon — you'll get a notification when {orderSummary.generatedGiftCards.length > 1 ? "they're" : "it's"} ready.</p>
                </div>
            }
            </div>
          }

          {placedOrderData &&
          <div className="mb-6 text-left" ref={receiptRef}>
              <p className="text-xs font-semibold text-stone-500 mb-2 text-center">📄 Your Receipt</p>
              <OrderReceipt order={placedOrderData} />
            </div>
          }

          <div className="flex gap-3 justify-center">
            <Link to={createPageUrl("Store")}>
              <Button className="bg-stone-900 hover:bg-stone-800 rounded-xl">Continue Shopping</Button>
            </Link>
            <Link to={createPageUrl("OrderHistory")}>
              <Button variant="outline" className="rounded-xl">Order History</Button>
            </Link>
          </div>
        </motion.div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link to={createPageUrl("Store")} className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>

        <h1 className="text-3xl font-bold text-stone-900 mb-8">Shopping Cart</h1>

        {cart.length === 0 ?
        <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 text-lg">Your cart is empty</p>
            <Link to={createPageUrl("Store")}>
              <Button className="mt-6 bg-stone-900 hover:bg-stone-800 rounded-xl">
                Browse Products
              </Button>
            </Link>
          </div> :

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-stone-100 p-5">
                {cart.map((item) =>
              <CartItem
                key={`${item.product_id}-${item.variant || ""}`}
                item={item}
                stock={getStock(item.product_id, item.variant, item.is_gift_card)}
                onUpdateQty={updateQty}
                onRemove={removeItem} />

              )}
              </div>

              {/* Fulfillment method + delivery address */}
              <div className="bg-white rounded-2xl border border-stone-100 p-5">
                <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-stone-500" /> Fulfillment
                </h3>
                <FulfillmentSelector value={fulfillment} onChange={setFulfillment} />
                {fulfillment.mode === "delivery" && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-stone-700 mb-3">Delivery Address</h4>
                    <LocationPicker value={delivery} onChange={(loc) => setDelivery(loc)} />
                  </div>
                )}
                {fulfillment.mode === "pickup" && (
                  <div className="mt-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <p className="font-semibold">Pickup information</p>
                    <p className="mt-1">🏠 Come to pick up your order at <span className="font-bold">Villa O-18, Retal Compound</span>. We'll have it ready for you. No delivery fee.</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl border border-stone-100 p-5 sticky top-24">
                <h3 className="font-semibold text-stone-900 mb-4">Order Summary</h3>
                <div className="space-y-2 mb-4">
                  {cart.map((item) =>
                <div key={`${item.product_id}-${item.variant || ""}`} className="flex justify-between text-sm">
                      <span className="text-stone-500 truncate mr-2">
                        {item.product_name}{item.variant ? ` (${item.variant})` : ""} ×{item.quantity}
                      </span>
                      <span className="font-medium">SAR {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                )}
                </div>

                {/* Promo Code */}
                <div className="mb-4">
                  {appliedPromos.map((promo) =>
                <div key={promo.code} className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">{promo.code}</span>
                        <span className="text-xs text-emerald-600">— {promo.label}</span>
                      </div>
                      <button onClick={() => removePromo(promo.code)} className="text-emerald-500 hover:text-emerald-700">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                )}
                  <div className="flex gap-2">
                    <Input
                    value={promoInput}
                    onChange={(e) => {setPromoInput(e.target.value);setPromoError("");}}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                    placeholder="Promo code"
                    className="rounded-xl text-sm h-9" />
                  
                    <Button
                    type="button"
                    variant="outline"
                    onClick={applyPromo}
                    className="rounded-xl h-9 px-3 text-sm whitespace-nowrap">
                    
                      Apply
                    </Button>
                  </div>
                  {promoError &&
                <p className="text-red-500 text-xs mt-1">{promoError}</p>
                }
                </div>

                {walletBalance > 0 && (
                  <label className="flex items-center justify-between gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 mb-3 cursor-pointer">
                    <span className="text-sm text-stone-700">
                      Use Gift Card Balance <span className="text-stone-400">(SAR {walletBalance.toFixed(2)} available)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={useWallet}
                      onChange={(e) => setUseWallet(e.target.checked)}
                      className="w-4 h-4 accent-stone-900"
                    />
                  </label>
                )}

                {storeWalletBalance > 0 && (
                  <label className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4 cursor-pointer">
                    <span className="text-sm text-stone-700">
                      Use {(currentUser?.full_name || currentUser?.email || "My")}'s Wallet <span className="text-stone-400">(SAR {storeWalletBalance.toFixed(2)} available)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={useStoreWallet}
                      onChange={(e) => setUseStoreWallet(e.target.checked)}
                      className="w-4 h-4 accent-stone-900"
                    />
                  </label>
                )}

                <TipSelector tip={tip} setTip={setTip} customTip={customTip} setCustomTip={setCustomTip} />

                <div className="border-t border-stone-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>Subtotal</span>
                    <span>SAR {subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 &&
                <div className="flex justify-between text-sm text-emerald-600">
                      <span>Discount</span>
                      <span>−SAR {discount.toFixed(2)}</span>
                    </div>
                }
                  <div className="flex justify-between text-sm text-stone-500">
                   <span>Shipping {isPickup ? "(pickup)" : delivery.address ? `(${delivery.address.split(",")[0]})` : ""}</span>
                   {isPickup ?
                   <span className="text-emerald-600 font-medium">Free</span> :
                   hasFreeShipping ?
                   <span className="text-emerald-600 font-medium">Free</span> :
                   delivery.address ?
                   baseShipping > 0 ? <span>SAR {baseShipping.toFixed(2)}</span> : <span className="text-emerald-600 font-medium">Free</span> :

                   <span className="text-stone-400 italic text-xs">Select location</span>
                   }
                   </div>
                  {tip > 0 &&
                <div className="flex justify-between text-sm text-stone-500">
                      <span>Tip</span>
                      <span>SAR {tip.toFixed(2)}</span>
                    </div>
                }
                  {giftCardApplied > 0 &&
                <div className="flex justify-between text-sm text-emerald-600">
                      <span>Gift Card</span>
                      <span>−SAR {giftCardApplied.toFixed(2)}</span>
                    </div>
                }
                  {storeWalletApplied > 0 &&
                <div className="flex justify-between text-sm text-amber-700">
                      <span>{(currentUser?.full_name || currentUser?.email || "My")}'s Wallet</span>
                      <span>−SAR {storeWalletApplied.toFixed(2)}</span>
                    </div>
                }
                  <div className="flex justify-between pt-2 border-t border-stone-100">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">SAR {total.toFixed(2)}</span>
                  </div>
                </div>

                {!showCheckout ?
              <Button
                onClick={() => setShowCheckout(true)}
                className="w-full mt-4 bg-stone-900 hover:bg-stone-800 rounded-xl h-12">
                
                    Proceed to Checkout
                  </Button> :

              <form onSubmit={handleCheckout} className="mt-4 space-y-3">
                    {childMember && (
                      <div className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-700 mb-2">
                        🧒 Family wallet: SAR {(childMember.balance || 0).toFixed(2)} ·
                        {childMember.limit_type === "daily" ? ` Daily limit SAR ${(childMember.daily_limit || 0).toFixed(2)}` : childMember.limit_type === "monthly" ? ` Monthly limit SAR ${(childMember.monthly_limit || 0).toFixed(2)}` : " No limit"}
                        · Remaining SAR {Math.max(0, remainingLimit).toFixed(2)}
                      </div>
                    )}
                    {/* Payment Method */}
                    <div>
                      <Label className="text-xs mb-2 block">Payment Method</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-all ${
                      paymentMethod === "cash" ?
                      "border-stone-900 bg-stone-50" :
                      "border-stone-200 bg-white hover:border-stone-300"}`
                      }>
                      
                          <span className="text-xl">💵</span>
                          <div className="text-left">
                            <p className="text-xs font-semibold text-stone-800">Cash</p>
                            <p className="text-xs text-stone-500">On delivery</p>
                          </div>
                        </button>
                        <button
                      type="button"
                      onClick={() => setPaymentMethod("instapay")}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-all ${
                      paymentMethod === "instapay" ?
                      "border-purple-600 bg-purple-50" :
                      "border-stone-200 bg-white hover:border-stone-300"}`
                      }>
                      
                          <span className="text-xl">📱</span>
                          <div className="text-left">
                            <p className="text-xs font-semibold text-stone-800">InstaPay</p>
                            <p className="text-xs text-stone-500">send to;01022206788</p>
                          </div>
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Full Name</Label>
                      <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="rounded-xl mt-1" />
                  
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="rounded-xl mt-1" />
                  
                    </div>
                    <div>
                      <Label className="text-xs">Notes (optional)</Label>
                      <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="rounded-xl mt-1" />
                  
                    </div>
                    <Button
                    type="submit"
                    disabled={submitting || !locationReady}
                    className="w-full bg-stone-900 hover:bg-stone-800 rounded-xl h-12 disabled:opacity-50">

                     {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {!locationReady ? "📍 Set Your Location First" : `Place Order — SAR ${total.toFixed(2)}`}
                    </Button>
                  </form>
              }
              </div>
            </div>
          </div>
        }
      </div>
    </div>);

}