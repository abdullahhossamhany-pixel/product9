const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const hash = (s) => btoa(String(s));

export default function SpendVerificationGate({ open, email, onClose, onVerified }) {
  const [step, setStep] = useState("idle");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => { if (!open) { setStep("idle"); setCode(""); setPendingId(null); } }, [open]);

  const sendCode = async () => {
    if (!email) { toast.error("Sign in first"); return; }
    setSending(true);
    try {
      const v = String(Math.floor(100000 + Math.random() * 900000));
      const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const created = await db.entities.SpendUnlock.create({
        customer_email: email.toLowerCase(),
        code_hash: hash(v),
        code_expires_at: expires,
        unlocked_until: null,
      });
      await db.integrations.Core.SendEmail({
        to: email,
        subject: "Your Try Market spend verification code",
        body: `Your verification code is ${v}. It expires in 15 minutes.\nOnce verified, you can spend your wallet, gift card balance, and points for 10 days.`,
      });
      setPendingId(created.id);
      setStep("sent");
      toast.success("Verification code sent to your email");
    } catch { toast.error("Could not send code"); }
    finally { setSending(false); }
  };

  const verify = async () => {
    if (!code) return;
    setVerifying(true);
    try {
      const rows = await db.entities.SpendUnlock.filter({ customer_email: email.toLowerCase() });
      const row = rows.find((r) => r.id === pendingId) || rows[0];
      if (!row) { toast.error("No pending code"); return; }
      if (row.code_expires_at && new Date(row.code_expires_at) < new Date()) {
        toast.error("Code expired — send a new one");
        setStep("idle");
        return;
      }
      if (hash(code.trim()) !== row.code_hash) { toast.error("Wrong code"); return; }
      const until = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      await db.entities.SpendUnlock.update(row.id, { unlocked_until: until });
      toast.success("Verified! You can spend your balances for 10 days.");
      onVerified && onVerified();
    } catch { toast.error("Could not verify"); }
    finally { setVerifying(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-stone-700" /> Verify to spend balance</DialogTitle>
          <DialogDescription>To pay with your wallet, gift card, or points, confirm it's you with a one-time email code. Unlocked for 10 days after verifying.</DialogDescription>
        </DialogHeader>
        {step === "idle" && (
          <div className="space-y-3">
            <p className="text-sm text-stone-600">We'll send a 6-digit code to <b>{email}</b>.</p>
            <Button onClick={sendCode} disabled={sending} className="w-full rounded-xl bg-stone-900 hover:bg-stone-800">
              {sending ? <span className="flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending…</span> : <span className="flex items-center"><Mail className="w-4 h-4 mr-2" /> Send verification code</span>}
            </Button>
          </div>
        )}
        {step === "sent" && (
          <div className="space-y-3">
            <p className="text-sm text-stone-600">Enter the 6-digit code sent to your email.</p>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} className="rounded-xl tracking-[0.3em] text-center text-lg" />
            <Button onClick={verify} disabled={verifying} className="w-full rounded-xl bg-stone-900 hover:bg-stone-800">
              {verifying ? <span className="flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying…</span> : <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-2" /> Verify</span>}
            </Button>
            <button type="button" onClick={sendCode} disabled={sending} className="text-xs text-stone-500 underline w-full text-center">Resend code</button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}