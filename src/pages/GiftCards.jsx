const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Gift, Loader2, Wallet, ShoppingBag, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ScratchCard from "@/components/customer/ScratchCard";

export default function GiftCards() {
  const [user, setUser] = useState(null);
  const [code, setCode] = useState("");
  const [claiming, setClaiming] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: wallets = [] } = useQuery({
    queryKey: ["gift-wallet", user?.email],
    queryFn: () => db.entities.GiftCardWallet.filter({ customer_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["gift-transactions", user?.email],
    queryFn: () => db.entities.GiftCardTransaction.filter({ customer_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const balance = wallets[0]?.balance || 0;

  const { data: purchasableCards = [] } = useQuery({
    queryKey: ["purchasable-gift-cards"],
    queryFn: () => db.entities.GiftCard.filter({ is_active: true }),
  });
  const availableCards = purchasableCards.filter((c) => !c.claimed_by_email && !c.purchased_by_email);

  // Gift cards sold to this customer and marked delivered by the team — scratch to reveal the code
  const { data: deliveredCards = [] } = useQuery({
    queryKey: ["delivered-gift-cards", user?.email],
    queryFn: () =>
      db.entities.GiftCard.filter({
        purchased_by_email: user.email,
        delivery_status: "delivered",
      }),
    enabled: !!user?.email,
  });
  const scratchCards = deliveredCards.filter((c) => !c.claimed_by_email);
  const [revealedCodes, setRevealedCodes] = useState({});
  const [scratchClaiming, setScratchClaiming] = useState(false);

  const claimToWallet = async (card) => {
    setScratchClaiming(true);
    try {
      await db.entities.GiftCard.update(card.id, {
        is_active: false,
        balance: 0,
        claimed_by_email: user.email,
      });
      const existingWallet = wallets[0];
      const newBalance = (existingWallet?.balance || 0) + card.initial_balance;
      if (existingWallet) {
        await db.entities.GiftCardWallet.update(existingWallet.id, { balance: newBalance });
      } else {
        await db.entities.GiftCardWallet.create({ customer_email: user.email, balance: newBalance });
      }
      await db.entities.GiftCardTransaction.create({
        customer_email: user.email,
        gift_card_code: card.code,
        type: "claim",
        amount: card.initial_balance,
        balance_after: newBalance,
      });
      toast.success(`SAR ${card.initial_balance.toFixed(2)} added to your balance!`);
      queryClient.invalidateQueries({ queryKey: ["gift-wallet", user.email] });
      queryClient.invalidateQueries({ queryKey: ["gift-transactions", user.email] });
      queryClient.invalidateQueries({ queryKey: ["delivered-gift-cards", user.email] });
    } catch {
      toast.error("Could not claim this gift card");
    } finally {
      setScratchClaiming(false);
    }
  };

  const [cartCodes, setCartCodes] = useState([]);
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCodes(cart.filter((i) => i.is_gift_card).map((i) => i.gift_card_code));
  }, []);

  const addCardToCart = (card) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.some((i) => i.gift_card_code === card.code)) {
      toast.error("Already in your cart");
      return;
    }
    cart.push({
      product_id: card.id,
      product_name: `Gift Card — SAR ${card.initial_balance.toFixed(2)}`,
      price: card.initial_balance,
      quantity: 1,
      image_url: "",
      is_gift_card: true,
      gift_card_code: card.code,
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    setCartCodes((prev) => [...prev, card.code]);
    toast.success("Gift card added to cart");
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      toast.error("Please sign in to claim a gift card");
      return;
    }
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setClaiming(true);
    try {
      const found = await db.entities.GiftCard.filter({ code: trimmed, is_active: true });
      const card = found[0];
      if (!card || card.claimed_by_email) {
        toast.error("Invalid or already claimed gift card code");
        return;
      }
      await db.entities.GiftCard.update(card.id, {
        is_active: false,
        balance: 0,
        claimed_by_email: user.email,
      });

      const existingWallet = wallets[0];
      const newBalance = (existingWallet?.balance || 0) + card.initial_balance;
      if (existingWallet) {
        await db.entities.GiftCardWallet.update(existingWallet.id, { balance: newBalance });
      } else {
        await db.entities.GiftCardWallet.create({ customer_email: user.email, balance: newBalance });
      }

      await db.entities.GiftCardTransaction.create({
        customer_email: user.email,
        gift_card_code: trimmed,
        type: "claim",
        amount: card.initial_balance,
        balance_after: newBalance,
      });

      toast.success(`SAR ${card.initial_balance.toFixed(2)} added to your balance!`);
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["gift-wallet", user.email] });
      queryClient.invalidateQueries({ queryKey: ["gift-transactions", user.email] });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-stone-900 mb-2 flex items-center gap-2">
          <Gift className="w-7 h-7" /> Gift Cards
        </h1>
        <p className="text-stone-500 mb-8">Buy a gift card for someone (or yourself), or claim a code you already have.</p>

        {scratchCards.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-stone-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Your Delivered Gift Cards
            </h3>
            <p className="text-xs text-stone-500 mb-4">Tap and drag on the scratch area to reveal your code, then add it to your balance.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {scratchCards.map((card) => (
                <div key={card.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col items-center gap-3">
                  <ScratchCard
                    code={card.code}
                    amountLabel={`SAR ${card.initial_balance.toFixed(2)}`}
                    onReveal={() => setRevealedCodes((s) => ({ ...s, [card.id]: true }))}
                  />
                  {revealedCodes[card.id] && (
                    <Button
                      size="sm"
                      disabled={scratchClaiming}
                      onClick={() => claimToWallet(card)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    >
                      {scratchClaiming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Add SAR {card.initial_balance.toFixed(2)} to my balance
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Buy a Gift Card
          </h3>
          {availableCards.length === 0 ? (
            <p className="text-stone-400 text-sm bg-white rounded-2xl border border-stone-100 p-5">
              No gift cards available to purchase right now. Check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableCards.map((card) => {
                const inCart = cartCodes.includes(card.code);
                return (
                  <div key={card.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900">SAR {card.initial_balance.toFixed(2)}</p>
                      {card.note && <p className="text-xs text-stone-400 mt-0.5">{card.note}</p>}
                    </div>
                    <Button
                      size="sm"
                      disabled={inCart}
                      onClick={() => addCardToCart(card)}
                      className="rounded-xl bg-stone-900 hover:bg-stone-800 shrink-0"
                    >
                      {inCart ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> In Cart</> : "Buy"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-stone-900 text-white rounded-2xl p-6 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-stone-300">Your Balance</p>
            <p className="text-2xl font-bold">SAR {balance.toFixed(2)}</p>
          </div>
        </div>

        <form onSubmit={handleClaim} className="bg-white rounded-2xl border border-stone-100 p-5 mb-8">
          <Label className="text-xs">Gift Card Code</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. GIFT-ABC123"
              className="rounded-xl font-mono"
            />
            <Button type="submit" disabled={claiming || !user} className="bg-stone-900 hover:bg-stone-800 rounded-xl shrink-0">
              {claiming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Claim
            </Button>
          </div>
          {!user && <p className="text-xs text-stone-400 mt-2">Sign in to claim a gift card.</p>}
        </form>

        <h3 className="font-semibold text-stone-900 mb-3">History</h3>
        {transactions.length === 0 ? (
          <p className="text-stone-400 text-sm">No gift card activity yet.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
            {transactions.map((t) => (
              <div key={t.id} className="flex justify-between items-center px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    {t.type === "claim" ? `Claimed ${t.gift_card_code}` : "Used at checkout"}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${t.type === "claim" ? "text-emerald-600" : "text-stone-600"}`}>
                  {t.type === "claim" ? "+" : "−"}SAR {t.amount?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}