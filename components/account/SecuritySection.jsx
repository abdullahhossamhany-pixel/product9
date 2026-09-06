const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";

import { Button } from "@/components/ui/button";
import { ShieldCheck, History, Smartphone, KeyRound, LogOut } from "lucide-react";
import { format } from "date-fns";

export default function SecuritySection({ user }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-3">
        <History className="w-5 h-5 text-stone-500 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-stone-900">Login history</p>
          <p className="text-sm text-stone-500">Account created {user.created_date ? format(new Date(user.created_date), "MMM d, yyyy") : "—"}</p>
          <p className="text-xs text-stone-400 mt-1">Detailed session history is managed securely by the platform.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-3">
        <Smartphone className="w-5 h-5 text-stone-500 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-stone-900">Devices</p>
          <p className="text-xs text-stone-400">Active sessions are managed by the platform. Sign out below to end this session.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-3">
        <KeyRound className="w-5 h-5 text-stone-500 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-stone-900">Security center &amp; password manager</p>
          <p className="text-xs text-stone-400">Password and account access are managed securely by Try Market.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700"><ShieldCheck className="w-5 h-5" /> <span className="text-sm font-medium">Sign out of this account</span></div>
        <Button onClick={() => db.auth.logout()} variant="outline" className="rounded-xl"><LogOut className="w-4 h-4 mr-1" /> Sign Out</Button>
      </div>
    </div>
  );
}