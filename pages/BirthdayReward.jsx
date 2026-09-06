const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cake, Loader2, ShieldCheck, Gift, Clock, XCircle, CheckCircle2, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BirthdayReward() {
  const [user, setUser] = useState(null);
  const [birthDate, setBirthDate] = useState("");
  const [cardUrl, setCardUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { db.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: rows = [], refetch } = useQuery({
    queryKey: ["birthday-submission", user?.email],
    queryFn: () => db.entities.BirthdaySubmission.filter({ customer_email: user.email }),
    enabled: !!user?.email,
  });
  const submissions = [...rows].sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));

  const onCard = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      setCardUrl(file_url);
      toast.success("ID uploaded");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    const email = user?.email;
    if (!email) { toast.error("Please sign in"); return; }
    if (!birthDate) { toast.error("Enter your birth date"); return; }
    if (!cardUrl) { toast.error("Upload an ID card for verification"); return; }
    setSaving(true);
    try {
      await db.entities.BirthdaySubmission.create({
        customer_email: email.toLowerCase(),
        customer_name: user.full_name || "",
        birth_date: birthDate,
        id_card_url: cardUrl,
        status: "pending",
        gift_claimed: false,
      });
      toast.success("Birthday submitted for verification");
      setBirthDate(""); setCardUrl("");
      refetch();
    } catch { toast.error("Could not submit"); }
    finally { setSaving(false); }
  };

  const claimGift = async (sub) => {
    try {
      const code = `BDAY-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      await db.entities.PromoCode.create({
        code, discount_type: "percent", discount_value: 25,
        label: "Birthday gift — 25% off", is_active: true, is_one_time: true,
        target_email: sub.customer_email, max_uses_per_user: 1,
      });
      await db.entities.BirthdaySubmission.update(sub.id, { gift_claimed: true });
      toast.success(`🎉 Birthday gift unlocked! Code: ${code}`);
      refetch();
    } catch { toast.error("Could not claim gift"); }
  };

  const isBirthMonth = (d) => d && (new Date(d).getMonth() === new Date().getMonth());

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-900 flex items-center justify-center gap-2"><Cake className="w-7 h-7 text-pink-500" /> Birthday Reward</h1>
          <p className="text-stone-500 mt-2">Submit your birthday with an ID card for verification to unlock a special gift in your birthday month. You can submit as many entries as you like.</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-3xl border border-stone-100 p-6 space-y-4">
          <div className="space-y-2">
            <Label>Birth date</Label>
            <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Upload your ID card (for verification)</Label>
            <Input type="file" accept="image/*" onChange={onCard} className="rounded-xl" required={!cardUrl} />
            {uploading && <p className="text-xs text-stone-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</p>}
            {cardUrl && <img src={cardUrl} alt="ID preview" className="w-24 h-24 rounded-xl object-cover border border-stone-200" />}
            <p className="text-xs text-stone-400">Your ID is shown to us only for verification and is removed once we decide — we don't keep it.</p>
          </div>
          <Button type="submit" disabled={saving || uploading} className="rounded-xl bg-stone-900 hover:bg-stone-800 w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />} Submit for Verification
          </Button>
        </form>

        {submissions.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="font-semibold text-stone-900 text-sm">Your submissions ({submissions.length})</h2>
            {submissions.map((s) => {
              const canClaim = s.status === "verified" && isBirthMonth(s.birth_date) && !s.gift_claimed;
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {s.status === "pending" && <React.Fragment><Clock className="w-5 h-5 text-amber-500" /><p className="text-stone-700 font-medium text-sm">Pending verification</p></React.Fragment>}
                    {s.status === "verified" && <React.Fragment><CheckCircle2 className="w-5 h-5 text-emerald-600" /><p className="text-stone-700 font-medium text-sm">Verified</p></React.Fragment>}
                    {s.status === "rejected" && <React.Fragment><XCircle className="w-5 h-5 text-red-500" /><p className="text-stone-700 font-medium text-sm">Rejected</p></React.Fragment>}
                  </div>
                  <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-600 space-y-1">
                    <p>Birthday: <b>{s.birth_date ? format(new Date(s.birth_date), "MMM d, yyyy") : "—"}</b></p>
                    {s.admin_note && <p>Note: {s.admin_note}</p>}
                  </div>
                  {canClaim && (
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-4 text-center">
                      <Gift className="w-7 h-7 text-pink-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-stone-900">It's your birthday month! 🎉</p>
                      <Button onClick={() => claimGift(s)} className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white mt-2">
                        <Gift className="w-4 h-4 mr-2" /> Claim Birthday Gift
                      </Button>
                    </div>
                  )}
                  {s.status === "verified" && s.gift_claimed && (
                    <p className="text-xs text-emerald-700 font-medium">🎁 Birthday gift claimed — check your promo codes on the Store.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}