const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Gift, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const generateCode = () =>
  "GIFT-" + Math.random().toString(36).substring(2, 8).toUpperCase();

export default function AdminGiftCards() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState(generateCode());
  const [balance, setBalance] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["gift-cards"],
    queryFn: () => db.entities.GiftCard.list("-created_date"),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["gift-card-transactions", expanded],
    queryFn: () => db.entities.GiftCardTransaction.filter({ gift_card_code: expanded }, "-created_date"),
    enabled: !!expanded,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    const value = parseFloat(balance);
    if (!code.trim() || !value || value <= 0) {
      toast.error("Enter a code and a valid balance");
      return;
    }
    setSaving(true);
    try {
      await db.entities.GiftCard.create({
        code: code.trim().toUpperCase(),
        initial_balance: value,
        balance: value,
        note,
      });
      toast.success("Gift card created");
      setCode(generateCode());
      setBalance("");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["gift-cards"] });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (card) => {
    await db.entities.GiftCard.update(card.id, { is_active: !card.is_active });
    queryClient.invalidateQueries({ queryKey: ["gift-cards"] });
  };

  const markDelivered = async (card) => {
    try {
      await db.entities.GiftCard.update(card.id, {
        delivery_status: "delivered",
        delivered_at: new Date().toISOString(),
      });
      if (card.purchased_by_email) {
        await db.entities.CustomerNotification.create({
          customer_email: card.purchased_by_email,
          type: "gift_card",
          title: "🎁 Your gift card has been delivered!",
          message: `Your SAR ${card.initial_balance?.toFixed(2)} gift card is ready. Tap to open and scratch to reveal your code.`,
          gift_card_id: card.id,
          link: "GiftCards",
        });
      }
      toast.success("Marked as delivered — customer has been notified");
      queryClient.invalidateQueries({ queryKey: ["gift-cards"] });
    } catch (e) {
      toast.error("Failed to mark delivered");
    }
  };

  const makeClaimableAgain = async (card) => {
    try {
      await db.entities.GiftCard.update(card.id, {
        is_active: true,
        claimed_by_email: "",
        balance: card.initial_balance,
        delivery_status: "delivered",
      });
      toast.success("Gift card made claimable again");
      queryClient.invalidateQueries({ queryKey: ["gift-cards"] });
    } catch (e) {
      toast.error("Failed to reset claim");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-stone-900 mb-2 flex items-center gap-2">
          <Gift className="w-7 h-7" /> Gift Cards
        </h1>
        <p className="text-stone-500 mb-8">Create gift cards, set balances, and track usage.</p>

        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-stone-100 p-5 mb-8 space-y-3">
          <h3 className="font-semibold text-stone-900">Create New Gift Card</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Code</Label>
              <div className="flex gap-2 mt-1">
                <Input value={code} onChange={(e) => setCode(e.target.value)} className="rounded-xl font-mono" />
                <Button type="button" variant="outline" size="icon" className="rounded-xl shrink-0" onClick={() => setCode(generateCode())}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Balance (SAR)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="rounded-xl mt-1"
                placeholder="e.g. 100"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Note (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl mt-1" rows={2} />
          </div>
          <Button type="submit" disabled={saving} className="bg-stone-900 hover:bg-stone-800 rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Gift Card
          </Button>
        </form>

        <h3 className="font-semibold text-stone-900 mb-3">All Gift Cards</h3>
        {isLoading ? (
          <p className="text-stone-400 text-sm">Loading...</p>
        ) : cards.length === 0 ? (
          <p className="text-stone-400 text-sm">No gift cards created yet.</p>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <div key={card.id} className="bg-white rounded-2xl border border-stone-100 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-mono font-semibold text-stone-900">{card.code}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Balance: SAR {card.balance?.toFixed(2)} / SAR {card.initial_balance?.toFixed(2)}
                    </p>
                    {card.claimed_by_email && (
                      <p className="text-xs text-stone-500">Claimed by {card.claimed_by_email}</p>
                    )}
                    {card.purchased_by_email && (
                      <p className="text-xs text-stone-500">
                        Bought by {card.purchased_by_email}
                        {card.delivery_status === "delivered"
                          ? ` · delivered ${new Date(card.delivered_at).toLocaleDateString()}`
                          : " · ⏳ pending delivery"}
                      </p>
                    )}
                    {card.note && <p className="text-xs text-stone-400 mt-1">{card.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={card.claimed_by_email ? "bg-emerald-100 text-emerald-700" : card.is_active ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-500"}>
                      {card.claimed_by_email ? "Claimed" : card.is_active ? "Unclaimed" : "Disabled"}
                    </Badge>
                    {card.purchased_by_email && card.delivery_status !== "delivered" && (
                      <Button
                        size="sm"
                        className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => markDelivered(card)}
                      >
                        Mark Delivered
                      </Button>
                    )}
                    {card.claimed_by_email && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs"
                        onClick={() => makeClaimableAgain(card)}
                      >
                        Make Claimable Again
                      </Button>
                    )}
                    {!card.claimed_by_email && !card.purchased_by_email && (
                      <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => toggleActive(card)}>
                        {card.is_active ? "Disable" : "Enable"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl text-xs"
                      onClick={() => setExpanded(expanded === card.code ? null : card.code)}
                    >
                      {expanded === card.code ? "Hide" : "Usage"}
                    </Button>
                  </div>
                </div>
                {expanded === card.code && (
                  <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5">
                    {transactions.length === 0 ? (
                      <p className="text-xs text-stone-400">No usage recorded.</p>
                    ) : (
                      transactions.map((t) => (
                        <div key={t.id} className="flex justify-between text-xs text-stone-600">
                          <span>{t.type === "claim" ? "Claimed" : "Spent"} by {t.customer_email}</span>
                          <span className="font-medium">SAR {t.amount?.toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}