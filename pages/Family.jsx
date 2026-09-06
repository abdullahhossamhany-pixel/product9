const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, ShieldCheck, Wallet, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateFamily from "@/components/family/CreateFamily";
import ParentDashboard from "@/components/family/ParentDashboard";
import ChildDashboard from "@/components/family/ChildDashboard";

const SELL = [
  { icon: ShieldCheck, text: "One identity for the whole family" },
  { icon: Wallet, text: "Top up children from your wallet" },
  { icon: TrendingDown, text: "Set daily or monthly spending limits" },
];

export default function Family() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {}).finally(() => setChecking(false));
  }, []);

  const { data: accounts = [] } = useQuery({
    queryKey: ["family-account", user?.email],
    queryFn: () => db.entities.FamilyAccount.filter({ parent_email: user.email }),
    enabled: !!user?.email,
  });
  const { data: memberships = [] } = useQuery({
    queryKey: ["my-family-membership", user?.email],
    queryFn: () => db.entities.FamilyMember.filter({ child_email: user.email }),
    enabled: !!user?.email,
  });

  const account = accounts[0];
  const isChild = memberships.some((m) => m.status === "active" || m.status === "pending");

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  // Brand-new / not-signed-in users: sign in directly into a family account
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-100 p-8 text-center">
          <div className="w-12 h-12 bg-stone-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Try Market Family</h1>
          <p className="text-sm text-stone-500 mt-2 mb-6">
            Sign in to manage your family wallet, children and spending limits — or create a new family account.
          </p>
          <div className="space-y-2 mb-6 text-left">
            {SELL.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-center gap-2 text-sm text-stone-600">
                  <Icon className="w-4 h-4 text-stone-400" /> {s.text}
                </div>
              );
            })}
          </div>
          <Button onClick={() => db.auth.redirectToLogin("/Family")} className="w-full rounded-xl bg-stone-900 hover:bg-stone-800">
            Sign in / Create family
          </Button>
          <p className="text-xs text-stone-400 mt-3">New here? Just sign in and you'll be guided to set up your family.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-6 h-6 text-stone-900" />
          <h1 className="text-2xl font-bold text-stone-900">Family</h1>
        </div>

        {isChild ? (
          <ChildDashboard user={user} />
        ) : account ? (
          <ParentDashboard account={account} user={user} />
        ) : (
          <CreateFamily user={user} />
        )}
      </div>
    </div>
  );
}