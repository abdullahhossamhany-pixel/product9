const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wallet, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function ChildDashboard({ user }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["my-family-membership", user.email],
    queryFn: () => db.entities.FamilyMember.filter({ child_email: user.email }),
  });
  const pending = members.find((m) => m.status === "pending");
  const member = members.find((m) => m.status === "active");

  const acceptInvite = async (m, accept) => {
    try {
      await db.entities.FamilyMember.update(m.id, {
        status: accept ? "active" : "removed",
        child_name: user.full_name || "",
      });
      qc.invalidateQueries({ queryKey: ["my-family-membership", user.email] });
      toast.success(accept ? "You joined the family" : "Invitation declined");
    } catch {
      toast.error("Could not update");
    }
  };

  const requestMoney = async () => {
    const amt = Number(amount) || 0;
    if (!member || amt <= 0) return;
    try {
      await db.entities.FamilyRequest.create({
        family_id: member.family_id,
        parent_email: member.parent_email,
        child_email: user.email,
        amount: amt,
        message: message.trim(),
        status: "pending",
      });
      setAmount("");
      setMessage("");
      toast.success("Money request sent to your parent");
    } catch {
      toast.error("Could not send request");
    }
  };

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin text-stone-400" />;

  if (pending && !member) {
    return (
      <div className="bg-white rounded-2xl border border-stone-100 p-6 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-1">Family invitation</h2>
        <p className="text-sm text-stone-500 mb-4">{pending.parent_name || pending.parent_email} ({pending.parent_role}) wants you to join their family manager.</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => acceptInvite(pending, true)} className="rounded-xl bg-stone-900 hover:bg-stone-800"><Check className="w-4 h-4 mr-1" /> Accept</Button>
          <Button onClick={() => acceptInvite(pending, false)} variant="outline" className="rounded-xl"><X className="w-4 h-4 mr-1" /> Decline</Button>
        </div>
      </div>
    );
  }

  if (!member) {
    return <p className="text-sm text-stone-400">You don't have a family yet.</p>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  let used = 0, cap = Infinity, capLabel = "No limit";
  if (member.limit_type === "daily") {
    used = (member.last_reset_date?.slice(0, 10) === today) ? (member.spent_today || 0) : 0;
    cap = member.daily_limit || 0;
    capLabel = `Daily SAR ${cap.toFixed(2)}`;
  } else if (member.limit_type === "monthly") {
    used = (member.last_reset_date?.slice(0, 7) === month) ? (member.spent_this_month || 0) : 0;
    cap = member.monthly_limit || 0;
    capLabel = `Monthly SAR ${cap.toFixed(2)}`;
  }
  const remaining = Math.max(0, cap - used);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <p className="text-sm text-stone-500">Managed by {member.parent_name || member.parent_email} ({member.parent_role})</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400">Family wallet</p>
            <p className="text-2xl font-bold text-stone-900 flex items-center gap-2"><Wallet className="w-5 h-5 text-stone-400" /> SAR {Number(member.balance || 0).toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-400">{capLabel}</p>
            <p className="font-semibold text-stone-900">SAR {remaining.toFixed(2)} left</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <h3 className="text-sm font-semibold text-stone-900 mb-3">Request money</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Amount (SAR)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Message</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="For groceries" className="mt-1.5 rounded-xl" />
          </div>
        </div>
        <Button onClick={requestMoney} className="rounded-xl bg-stone-900 hover:bg-stone-800 mt-3">Send request</Button>
      </div>
    </div>
  );
}