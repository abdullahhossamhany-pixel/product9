const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, Wallet, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ParentDashboard({ account, user }) {
  const qc = useQueryClient();
  const [childEmail, setChildEmail] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["family-members", account.id],
    queryFn: () => db.entities.FamilyMember.filter({ family_id: account.id }),
  });
  const { data: requests = [] } = useQuery({
    queryKey: ["family-requests", account.id],
    queryFn: () => db.entities.FamilyRequest.filter({ family_id: account.id, status: "pending" }),
  });
  const { data: wallets = [] } = useQuery({
    queryKey: ["parent-wallet", account.parent_email],
    queryFn: () => db.entities.CustomerWallet.filter({ customer_email: account.parent_email }),
  });
  const parentWallet = wallets[0]?.balance || 0;

  const addChild = async () => {
    if (!childEmail.trim()) return;
    try {
      await db.entities.FamilyMember.create({
        family_id: account.id,
        parent_email: account.parent_email,
        parent_name: account.parent_name,
        parent_role: account.parent_role,
        child_email: childEmail.trim(),
        child_name: "",
        status: "pending",
        balance: 0,
        limit_type: "none",
        daily_limit: 0,
        monthly_limit: 0,
        spent_today: 0,
        spent_this_month: 0,
      });
      setChildEmail("");
      qc.invalidateQueries({ queryKey: ["family-members", account.id] });
      toast.success("Invitation sent — ask your child to accept it on their device.");
    } catch {
      toast.error("Could not add child");
    }
  };

  const saveLimit = async (m, limitType, daily, monthly) => {
    try {
      await db.entities.FamilyMember.update(m.id, {
        limit_type: limitType,
        daily_limit: Number(daily) || 0,
        monthly_limit: Number(monthly) || 0,
      });
      qc.invalidateQueries({ queryKey: ["family-members", account.id] });
      toast.success("Limit saved");
    } catch {
      toast.error("Could not save limit");
    }
  };

  const topUp = async (m, amt) => {
    const amount = Number(amt) || 0;
    if (amount <= 0) return;
    if (parentWallet < amount) {
      toast.error("Not enough in your wallet");
      return;
    }
    try {
      if (wallets[0]) await db.entities.CustomerWallet.update(wallets[0].id, { balance: parentWallet - amount });
      await db.entities.FamilyMember.update(m.id, { balance: (m.balance || 0) + amount });
      qc.invalidateQueries({ queryKey: ["family-members", account.id] });
      qc.invalidateQueries({ queryKey: ["parent-wallet", account.parent_email] });
      toast.success(`Topped up ${m.child_name || m.child_email}`);
    } catch {
      toast.error("Top-up failed");
    }
  };

  const removeFamily = async () => {
    if (!confirm("Remove this family account? All children and their family wallet balances will be deleted. This cannot be undone.")) return;
    try {
      await db.entities.FamilyMember.deleteMany({ family_id: account.id });
      await db.entities.FamilyRequest.deleteMany({ family_id: account.id });
      await db.entities.FamilyAccount.delete(account.id);
      qc.invalidateQueries();
      toast.success("Family account removed");
    } catch {
      toast.error("Could not remove family account");
    }
  };

  const resolveRequest = async (r, approve) => {
    const amount = Number(r.amount) || 0;
    if (approve && amount > parentWallet) {
      toast.error("Not enough in your wallet");
      return;
    }
    try {
      if (approve) {
        if (wallets[0]) await db.entities.CustomerWallet.update(wallets[0].id, { balance: parentWallet - amount });
        const mem = members.find((m) => m.child_email === r.child_email);
        if (mem) await db.entities.FamilyMember.update(mem.id, { balance: (mem.balance || 0) + amount });
      }
      await db.entities.FamilyRequest.update(r.id, { status: approve ? "approved" : "rejected", resolved_date: new Date().toISOString() });
      qc.invalidateQueries();
      toast.success(approve ? "Money sent" : "Request rejected");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500 capitalize">{account.parent_role}'s family</p>
          <p className="text-xs text-stone-400">{members.filter((m) => m.status === "active").length} child(ren)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-stone-400">Your wallet</p>
            <p className="text-lg font-bold text-stone-900 flex items-center gap-1"><Wallet className="w-4 h-4 text-stone-400" /> SAR {parentWallet.toFixed(2)}</p>
          </div>
          <Button variant="outline" onClick={removeFamily} className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50">
            <Trash2 className="w-4 h-4 mr-1" /> Remove family
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Add a child</h3>
        <div className="flex gap-2">
          <Input value={childEmail} onChange={(e) => setChildEmail(e.target.value)} placeholder="Child's account email" className="rounded-xl" />
          <Button onClick={addChild} className="rounded-xl bg-stone-900 hover:bg-stone-800">Invite</Button>
        </div>
        <p className="text-xs text-stone-400 mt-2">Your child must have a Try Market account. They'll see an invitation to join on their device.</p>
      </div>

      {requests.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h3 className="text-sm font-semibold text-stone-900 mb-3">Money requests</h3>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between border border-stone-100 rounded-xl p-3">
                <div>
                  <p className="text-sm text-stone-900 font-medium">{r.child_email}</p>
                  <p className="text-sm text-stone-600">SAR {Number(r.amount).toFixed(2)} {r.message ? `· "${r.message}"` : ""}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => resolveRequest(r, true)} className="text-xs bg-emerald-600 text-white rounded-lg px-2 py-1 flex items-center gap-1"><Check className="w-3 h-3" /> Send</button>
                  <button onClick={() => resolveRequest(r, false)} className="text-xs text-stone-500 border border-stone-200 rounded-lg px-2 py-1 flex items-center gap-1"><X className="w-3 h-3" /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        ) : members.length === 0 ? (
          <p className="text-sm text-stone-400">No children yet — add one above.</p>
        ) : (
          members.map((m) => <ChildRow key={m.id} member={m} onSaveLimit={saveLimit} onTopUp={topUp} />)
        )}
      </div>
    </div>
  );
}

function ChildRow({ member, onSaveLimit, onTopUp }) {
  const [limitType, setLimitType] = useState(member.limit_type || "none");
  const [daily, setDaily] = useState(member.daily_limit || 0);
  const [monthly, setMonthly] = useState(member.monthly_limit || 0);
  const [topAmt, setTopAmt] = useState("");

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-stone-900">{member.child_name || member.child_email}</p>
          <p className="text-xs text-stone-400">{member.status === "pending" ? "Pending — waiting for child to accept" : "Active"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-400">Family wallet</p>
          <p className="font-bold text-stone-900">SAR {Number(member.balance || 0).toFixed(2)}</p>
        </div>
      </div>
      {member.status === "active" && (
        <>
          <div className="grid sm:grid-cols-3 gap-3 items-end mb-3">
            <div>
              <Label>Spending limit</Label>
              <Select value={limitType} onValueChange={setLimitType}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No limit</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {limitType === "daily" && (
              <div>
                <Label>Daily limit (SAR)</Label>
                <Input type="number" value={daily} onChange={(e) => setDaily(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
            )}
            {limitType === "monthly" && (
              <div>
                <Label>Monthly limit (SAR)</Label>
                <Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
            )}
            <Button variant="outline" className="rounded-xl" onClick={() => onSaveLimit(member, limitType, daily, monthly)}>Save limit</Button>
          </div>
          <div className="flex gap-2">
            <Input type="number" value={topAmt} onChange={(e) => setTopAmt(e.target.value)} placeholder="Top up amount" className="rounded-xl max-w-[160px]" />
            <Button className="rounded-xl bg-stone-900 hover:bg-stone-800" onClick={() => onTopUp(member, topAmt)}>Top up</Button>
          </div>
        </>
      )}
    </div>
  );
}