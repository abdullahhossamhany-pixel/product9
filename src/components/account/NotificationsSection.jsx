import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail } from "lucide-react";

export default function NotificationsSection({ profile, onSave }) {
  const [prefs, setPrefs] = useState({
    email_order_updates: profile.email_order_updates ?? true,
    email_promo_updates: profile.email_promo_updates ?? true,
    notif_order_updates: profile.notif_order_updates ?? true,
  });
  const set = (k, v) => setPrefs({ ...prefs, [k]: v });

  const Row = ({ icon: Icon, label, desc, k }) => (
    <div className="flex items-center justify-between border border-stone-100 rounded-xl p-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-stone-500" />
        <div>
          <p className="text-sm font-medium text-stone-900">{label}</p>
          <p className="text-xs text-stone-400">{desc}</p>
        </div>
      </div>
      <Switch checked={prefs[k]} onCheckedChange={(v) => set(k, v)} />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-3">
      <Row icon={Mail} label="Order updates (email)" desc="Receipts and delivery confirmations" k="email_order_updates" />
      <Row icon={Mail} label="Promo offers (email)" desc="Discounts and new arrivals" k="email_promo_updates" />
      <Row icon={Bell} label="In-app order alerts" desc="Push-style notifications in the bell" k="notif_order_updates" />
      <Button onClick={() => onSave(prefs)} className="rounded-xl bg-stone-900 hover:bg-stone-800">Save Notification Settings</Button>
    </div>
  );
}