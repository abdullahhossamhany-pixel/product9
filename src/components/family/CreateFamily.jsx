const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, Wallet, ShieldCheck, TrendingDown } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { icon: UserPlus, title: "Add your children", desc: "Invite each child by their account email. They'll accept on their own device." },
  { icon: Wallet, title: "Top up their wallets", desc: "Approve money requests or top up directly — funds move from your wallet to theirs." },
  { icon: TrendingDown, title: "Set spending limits", desc: "Choose a daily or monthly limit per child so they can't overspend." },
];

export default function CreateFamily({ user }) {
  const qc = useQueryClient();
  const [role, setRole] = useState("dad");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!password.trim()) {
      toast.error("Set a family password");
      return;
    }
    setSaving(true);
    try {
      await db.entities.FamilyAccount.create({
        parent_email: user.email,
        parent_name: user.full_name || "",
        parent_role: role,
        family_password: password,
      });
      qc.invalidateQueries({ queryKey: ["family-account", user.email] });
      toast.success("Family created! Now add your children.");
    } catch {
      toast.error("Could not create family");
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6">
      <h2 className="text-xl font-bold text-stone-900 mb-1">Start a family account</h2>
      <p className="text-sm text-stone-500 mb-5">Create a family, add your children, fund them and control their spending.</p>

      {/* Setup guide */}
      <div className="rounded-xl border border-stone-100 bg-stone-50 p-4 mb-6">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Setup guide</p>
        <div className="space-y-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{i + 1}. {s.title}</p>
                  <p className="text-xs text-stone-500">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-stone-400 mt-3">When a child orders, their remaining limit and wallet go down automatically.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>I am the</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dad">Dad</SelectItem>
              <SelectItem value="mom">Mom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Family password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Used to manage your family" className="mt-1.5 rounded-xl" />
          <p className="text-xs text-stone-400 mt-1">Keep this safe — you'll use it to manage children and limits.</p>
        </div>
        <Button onClick={create} disabled={saving} className="rounded-xl bg-stone-900 hover:bg-stone-800">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create family
        </Button>
      </div>
    </div>
  );
}