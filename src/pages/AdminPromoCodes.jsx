const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Trash2, Tag, EyeOff, Gift } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useEffect } from "react";

export default function AdminPromoCodes() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [giftingEmail, setGiftingEmail] = useState("");
  const [discountPct, setDiscountPct] = useState("10");
  const [usesAllowed, setUsesAllowed] = useState("1");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me().then(u => setIsAdmin(u.role === "admin")).catch(() => setIsAdmin(false));
  }, []);

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: () => db.entities.PromoCode.list("-created_date"),
    enabled: isAdmin === true,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => db.entities.User.list(),
    enabled: isAdmin === true,
  });
  const customers = users.filter((u) => u.role !== "admin" && u.email);

  const personalPromos = codes.filter((c) => c.target_email);
  const customerWithoutPromo = customers.filter(
    (c) => !personalPromos.some((p) => p.target_email === c.email && p.is_active !== false)
  );

  const givePersonalPromo = async (email, pct, uses) => {
    const value = Math.min(100, Math.max(0, Number(pct) || 0));
    if (value <= 0) { toast.error("Enter a valid discount percent"); return; }
    const maxUses = Math.max(1, Number(uses) || 1);
    const code = `VIP${Math.floor(value)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    try {
      await db.entities.PromoCode.create({
        code,
        description: `Personal ${value}% off promo for ${email} (max ${maxUses} use${maxUses > 1 ? "s" : ""})`,
        discount_type: "percent",
        discount_value: value,
        label: `${value}% off`,
        is_active: true,
        target_email: email,
        max_uses_per_user: maxUses,
      });
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast.success(`${value}% off promo "${code}" created for ${email} (×${maxUses})`);
      setGiftingEmail("");
    } catch (e) {
      toast.error("Failed to create personal promo");
    }
  };

  const handleGiftSubmit = (e) => {
    e?.preventDefault();
    if (!giftingEmail.trim()) { toast.error("Pick a customer"); return; }
    givePersonalPromo(giftingEmail.trim(), discountPct, usesAllowed);
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.PromoCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast.success("Promo code deleted");
    },
  });

  const handleGenerate = async () => {
    if (!codeInput.trim() || !descInput.trim()) {
      toast.error("Please enter both a code and a description");
      return;
    }
    setGenerating(true);
    try {
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `You are a promo code system. The admin wants to create a promo code called "${codeInput.toUpperCase()}".
The admin describes what this code should do: "${descInput}"

Based on the description, determine:
1. discount_type: one of "percent", "fixed", or "shipping" (shipping = free shipping)
2. discount_value: a number (for percent: 0-100, for fixed: EGP amount, for shipping: 0)
3. label: a short human-readable label like "20% off" or "Free Delivery" or "EGP 15 off"

Respond ONLY with JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            discount_type: { type: "string" },
            discount_value: { type: "number" },
            label: { type: "string" },
          },
        },
      });

      await db.entities.PromoCode.create({
        code: codeInput.trim().toUpperCase(),
        description: descInput.trim(),
        discount_type: result.discount_type,
        discount_value: result.discount_value ?? 0,
        label: result.label,
        is_active: true,
      });

      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast.success(`Promo code "${codeInput.toUpperCase()}" created!`);
      setCodeInput("");
      setDescInput("");
    } catch (e) {
      toast.error("Failed to generate promo code");
    }
    setGenerating(false);
  };

  if (isAdmin === null) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-stone-400" /></div>;

  if (!isAdmin) return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
      <EyeOff className="w-12 h-12 text-red-400" />
      <h2 className="text-xl font-bold">Access Denied</h2>
      <Button onClick={() => navigate(createPageUrl("Store"))} variant="outline" className="rounded-xl">Go to Store</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-stone-900">AI Promo Codes</h1>
            <p className="text-stone-500 text-sm">Describe what a code does — AI figures out the discount</p>
          </div>
        </div>

        {/* Create Form */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-8 shadow-sm">
          <h2 className="font-semibold text-stone-900 mb-4">Create New Promo Code</h2>
          <div className="space-y-4">
            <div>
              <Label>Promo Code</Label>
              <Input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE30"
                className="rounded-xl mt-1 font-mono uppercase"
              />
            </div>
            <div>
              <Label>Tell the AI what this code does</Label>
              <Textarea
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                placeholder="e.g. Give the customer 30% off their order total, or give free shipping, or take 15 EGP off..."
                className="rounded-xl mt-1 min-h-[100px]"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-stone-900 hover:bg-stone-800 rounded-xl w-full h-11"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> AI is generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Create with AI</>
              )}
            </Button>
          </div>
        </div>

        {/* Personal Promo Codes */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-8 shadow-sm">
          <h2 className="font-semibold text-stone-900 mb-1">Give a Customer a Personal Promo</h2>
          <p className="text-stone-500 text-sm mb-4">
            Pick a signed-in customer and a discount % — they'll see the code on the Store the moment they sign in.
          </p>
          <form onSubmit={handleGiftSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <Label>Customer email</Label>
              <select
                value={giftingEmail}
                onChange={(e) => setGiftingEmail(e.target.value)}
                className="w-full mt-1 rounded-xl border border-stone-200 h-10 px-3 text-sm bg-white"
              >
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.email}>
                    {c.email}{c.full_name ? ` (${c.full_name})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <Label>Discount %</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                className="rounded-xl mt-1"
              />
            </div>
            <div className="w-28">
              <Label>Times redeemable</Label>
              <Input
                type="number"
                min="1"
                value={usesAllowed}
                onChange={(e) => setUsesAllowed(e.target.value)}
                className="rounded-xl mt-1"
              />
            </div>
            <Button type="submit" className="bg-stone-900 hover:bg-stone-800 rounded-xl h-10">
              <Gift className="w-4 h-4 mr-2" /> Give Promo
            </Button>
          </form>

          {personalPromos.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Active personal promos</p>
              {personalPromos.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-stone-50 border border-stone-100 rounded-xl px-3 py-2">
                  <div className="text-sm">
                    <span className="font-mono font-bold text-stone-900">{p.code}</span>
                    <span className="text-stone-500 ml-2">— {p.label}</span>
                    <span className="text-stone-400 ml-2 text-xs">×{p.max_uses_per_user || 1}</span>
                  </div>
                  <span className="text-xs text-stone-600">{p.target_email}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Existing Codes */}
        <h2 className="font-semibold text-stone-900 mb-4">All Promo Codes</h2>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-stone-400" /></div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No promo codes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((code) => (
              <div key={code.id} className="bg-white rounded-xl border border-stone-100 p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-stone-900 text-lg">{code.code}</span>
                    <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-200 bg-emerald-50">
                      {code.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-stone-500 border-stone-200">
                      {code.discount_type}
                    </Badge>
                    {code.target_email && (
                      <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50">
                        👤 {code.target_email}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-stone-500">{code.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-stone-400 hover:text-red-500 shrink-0"
                  onClick={() => { if (confirm("Delete this promo code?")) deleteMutation.mutate(code.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}