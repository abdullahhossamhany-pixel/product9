const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Wallet, Gift, Users } from "lucide-react";

export default function WalletSection({ user }) {
  const { data: storeWallets = [] } = useQuery({
    queryKey: ["customer-store-wallet", user?.email],
    queryFn: () => db.entities.CustomerWallet.filter({ customer_email: user.email }),
    enabled: !!user?.email,
  });
  const { data: giftWallets = [] } = useQuery({
    queryKey: ["gift-wallet-section", user?.email],
    queryFn: () => db.entities.GiftCardWallet.filter({ customer_email: user.email }),
    enabled: !!user?.email,
  });
  const storeBalance = storeWallets[0]?.balance || 0;
  const giftBalance = giftWallets[0]?.balance || 0;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <p className="text-xs text-stone-400 flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Try Market Wallet</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">SAR {storeBalance.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <p className="text-xs text-stone-400 flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Gift Card Wallet</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">SAR {giftBalance.toFixed(2)}</p>
        </div>
      </div>
      <Link to={createPageUrl("Wallet")} className="bg-stone-900 text-white rounded-2xl p-5 flex items-center gap-3 hover:bg-stone-800 transition-colors">
        <Wallet className="w-5 h-5" />
        <div>
          <p className="text-sm font-semibold">Open full wallet</p>
          <p className="text-sm text-stone-300">Top up, fair split &amp; full money history</p>
        </div>
      </Link>
      <Link to={createPageUrl("Family")} className="bg-white rounded-2xl border border-stone-100 p-5 flex items-center gap-3 hover:shadow-sm transition-shadow">
        <Users className="w-5 h-5 text-stone-500" />
        <div>
          <p className="text-sm font-semibold text-stone-900">Family wallet</p>
          <p className="text-sm text-stone-500">Manage children, limits &amp; allowances, or view your family balance</p>
        </div>
      </Link>
      <Link to={createPageUrl("GiftCards")} className="bg-white rounded-2xl border border-stone-100 p-5 flex items-center gap-3 hover:shadow-sm transition-shadow">
        <Gift className="w-5 h-5 text-stone-500" />
        <div>
          <p className="text-sm font-semibold text-stone-900">Gift cards</p>
          <p className="text-sm text-stone-500">Redeem codes &amp; buy gift cards</p>
        </div>
      </Link>
    </div>
  );
}