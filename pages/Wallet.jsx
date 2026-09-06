const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Wallet as WalletIcon, Gift, Loader2 } from "lucide-react";
import RequestTopup from "@/components/wallet/RequestTopup";
import WalletTransactions from "@/components/wallet/WalletTransactions";

export default function Wallet() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: storeWallets = [] } = useQuery({
    queryKey: ["wallet-store", user?.email],
    queryFn: () => db.entities.CustomerWallet.filter({ customer_email: user.email }),
    enabled: !!user?.email,
  });
  const { data: giftWallets = [] } = useQuery({
    queryKey: ["wallet-gift", user?.email],
    queryFn: () => db.entities.GiftCardWallet.filter({ customer_email: user.email }),
    enabled: !!user?.email,
  });
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  const storeBalance = storeWallets[0]?.balance || 0;
  const giftBalance = giftWallets[0]?.balance || 0;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-stone-900 mb-6 flex items-center gap-2"><WalletIcon className="w-7 h-7" /> Wallet</h1>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <p className="text-xs text-stone-400 flex items-center gap-1"><WalletIcon className="w-3.5 h-3.5" /> {(user.full_name || user.email) + "'s Wallet"}</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">SAR {storeBalance.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <p className="text-xs text-stone-400 flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Gift Card Wallet</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">SAR {giftBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-6"><RequestTopup user={user} /></div>

        <div className="mt-6"><WalletTransactions user={user} /></div>
      </div>
    </div>
  );
}