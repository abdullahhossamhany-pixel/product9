const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Users, Loader2, Send, Inbox, MinusCircle, PlusCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminWallets() {
  const [user, setUser] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("add"); // "add" | "subtract"
  const [busy, setBusy] = useState(false);

  useEffect(() => { db.auth.me().then(setUser).catch(() => {}); }, []);
  const isAdmin = user?.role === "admin";

  const { data: wallets = [], refetch: refetchWallets } = useQuery({
    queryKey: ["admin-customer-wallets"],
    queryFn: () => db.entities.CustomerWallet.list("-balance"),
    enabled: !!isAdmin,
  });

  const { data: topupReqs = [], refetch: refetchReqs } = useQuery({
    queryKey: ["pending-wallet-topups"],
    queryFn: () => db.entities.WalletTopupRequest.filter({ status: "pending" }),
    enabled: !!isAdmin,
  });

  const approveTopup = async (r) => {
    const amt = Number(r.amount) || 0;
    if (amt <= 0) return;
    setBusy(true);
    try {
      const existing = await db.entities.CustomerWallet.filter({ customer_email: r.customer_email });
      if (existing.length > 0) {
        const w = existing[0];
        await db.entities.CustomerWallet.update(w.id, { balance: (w.balance || 0) + amt });
      } else {
        await db.entities.CustomerWallet.create({ customer_email: r.customer_email, balance: amt });
      }
      await db.entities.WalletTopupRequest.update(r.id, { status: "approved", resolved_date: new Date().toISOString() });
      toast.success("Top-up approved");
      refetchReqs();
      refetchWallets();
    } catch {
      toast.error("Failed to approve top-up");
    } finally {
      setBusy(false);
    }
  };

  const rejectTopup = async (r) => {
    try {
      await db.entities.WalletTopupRequest.update(r.id, { status: "rejected", resolved_date: new Date().toISOString() });
      refetchReqs();
      toast.success("Request rejected");
    } catch {
      toast.error("Failed");
    }
  };

  const topUp = async (e) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    const amt = parseFloat(amount);
    if (!email || !amt || amt <= 0) {
      toast.error("Enter a customer email and a positive amount");
      return;
    }
    setBusy(true);
    try {
      const existing = await db.entities.CustomerWallet.filter({ customer_email: email });
      if (mode === "subtract") {
        if (existing.length === 0) { toast.error("No wallet found for that email"); return; }
        const w = existing[0];
        if ((w.balance || 0) - amt < 0) { toast.error("Insufficient balance on this wallet"); return; }
        await db.entities.CustomerWallet.update(w.id, { balance: (w.balance || 0) - amt });
        toast.success(`Subtracted SAR ${amt.toFixed(2)} from ${email}`);
      } else if (existing.length > 0) {
        const w = existing[0];
        await db.entities.CustomerWallet.update(w.id, { balance: (w.balance || 0) + amt });
        toast.success(`Added SAR ${amt.toFixed(2)} to ${email}`);
      } else {
        await db.entities.CustomerWallet.create({ customer_email: email, balance: amt });
        toast.success(`Added SAR ${amt.toFixed(2)} to ${email}`);
      }
      setEmailInput("");
      setAmount("");
      refetchWallets();
    } catch {
      toast.error(mode === "subtract" ? "Failed to subtract from wallet" : "Failed to top up wallet");
    } finally {
      setBusy(false);
    }
  };

  const subtractRow = async (w) => {
    if (busy) return;
    const input = prompt(`Subtract SAR amount from ${w.customer_email}\nCurrent balance: SAR ${(w.balance || 0).toFixed(2)}`);
    if (input == null) return;
    const amt = parseFloat(input);
    if (!amt || amt <= 0) { toast.error("Enter a positive amount to subtract"); return; }
    if ((w.balance || 0) - amt < 0) { toast.error("Amount exceeds the wallet balance"); return; }
    setBusy(true);
    try {
      await db.entities.CustomerWallet.update(w.id, { balance: (w.balance || 0) - amt });
      toast.success(`Subtracted SAR ${amt.toFixed(2)} from ${w.customer_email}`);
      refetchWallets();
    } catch {
      toast.error("Failed to subtract");
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) {
    return <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500">Admins only</div>;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-stone-900 mb-2 flex items-center gap-2">
          <Wallet className="w-7 h-7" /> Wallets
        </h1>
        <p className="text-stone-500 mb-8">Top up and manage customer store credit.</p>

        {/* Customer wallet top-up */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5 mb-6">
          <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
            <Send className="w-4 h-4" /> Add credit to a customer's wallet
          </h3>
          <form onSubmit={topUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs">Customer email</Label>
              <Input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="customer@email.com" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs">Amount (SAR)</Label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.50" className="rounded-xl mt-1" />
            </div>
            <div className="sm:col-span-3 flex items-center gap-2">
              <div className="flex rounded-xl border border-stone-200 overflow-hidden">
                <button type="button" onClick={() => setMode("add")} className={`flex items-center gap-1 px-3 py-2 text-sm font-medium ${mode === "add" ? "bg-stone-900 text-white" : "bg-white text-stone-500 hover:bg-stone-50"}`}>
                  <PlusCircle className="w-4 h-4" /> Add
                </button>
                <button type="button" onClick={() => setMode("subtract")} className={`flex items-center gap-1 px-3 py-2 text-sm font-medium ${mode === "subtract" ? "bg-rose-600 text-white" : "bg-white text-stone-500 hover:bg-stone-50"}`}>
                  <MinusCircle className="w-4 h-4" /> Subtract
                </button>
              </div>
              <Button type="submit" disabled={busy} className={`rounded-xl ${mode === "subtract" ? "bg-rose-600 hover:bg-rose-700" : "bg-stone-900"}`}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} {mode === "subtract" ? "Subtract from Wallet" : "Add to Wallet"}
              </Button>
            </div>
          </form>
        </div>

        {/* Top-up requests */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5 mb-6">
          <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
            <Inbox className="w-4 h-4" /> Top-up requests
          </h3>
          {topupReqs.length === 0 ? (
            <p className="text-stone-400 text-sm">No pending customer top-up requests.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {topupReqs.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{r.customer_email}</p>
                    <p className="text-xs text-stone-400">SAR {Number(r.amount).toFixed(2)}{r.message ? ` · "${r.message}"` : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveTopup(r)} disabled={busy} className="rounded-lg bg-emerald-600 hover:bg-emerald-700">Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => rejectTopup(r)} className="rounded-lg">Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wallet list */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" /> Customer Wallets
          </h3>
          {wallets.length === 0 ? (
            <p className="text-stone-400 text-sm">No customer wallets yet.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {wallets.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{w.customer_email}</p>
                    <p className="text-xs text-stone-400">Created {new Date(w.created_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="sm" variant="outline" onClick={() => subtractRow(w)} disabled={busy} className="rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50">
                      <MinusCircle className="w-4 h-4 mr-1" /> Subtract
                    </Button>
                    <p className="text-lg font-bold text-stone-900">SAR {(w.balance || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}