const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Copy, CheckCircle, Loader2, Gift, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Redeem() {
  const [user, setUser] = useState(null);
  const [redeemedReward, setRedeemedReward] = useState(null);
  const [confirmReward, setConfirmReward] = useState(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: rewards = [], isLoading: loadingRewards } = useQuery({
    queryKey: ["redeem-rewards"],
    queryFn: () => db.entities.RedeemReward.filter({ is_active: true }, "points_required"),
  });

  const { data: pointsRecords = [], isLoading: loadingPoints } = useQuery({
    queryKey: ["my-points", user?.email],
    queryFn: () => db.entities.Points.filter({ customer_email: user.email }),
    enabled: !!user?.email,
  });

  const myPoints = pointsRecords[0]?.points ?? 0;
  const pointsRecordId = pointsRecords[0]?.id;

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      if (myPoints < reward.points_required) throw new Error("Not enough points");
      const newPoints = myPoints - reward.points_required;
      if (pointsRecordId) {
        await db.entities.Points.update(pointsRecordId, { points: newPoints });
      }
      // Generate a unique one-time promo code for this specific user
      const newCode = generateCode();
      await db.entities.PromoCode.create({
        code: newCode,
        description: `Redeemed by ${user.email} for reward: ${reward.title}`,
        discount_type: reward.discount_type || "fixed",
        discount_value: reward.discount_value || 0,
        label: reward.label || reward.title,
        is_active: true,
        redeemed_by: user.email,
        is_one_time: true,
      });
      return { ...reward, promo_code: newCode };
    },
    onSuccess: (reward) => {
      queryClient.invalidateQueries({ queryKey: ["my-points", user?.email] });
      setRedeemedReward(reward);
      setConfirmReward(null);
      toast.success("Reward redeemed!");
    },
    onError: (e) => toast.error(e.message || "Could not redeem"),
  });

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4 px-6">
        <Gift className="w-16 h-16 text-stone-300" />
        <h2 className="text-xl font-bold text-stone-800">Sign in to see your points</h2>
        <Button onClick={() => db.auth.redirectToLogin()} className="bg-stone-900 hover:bg-stone-800 rounded-xl">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link to={createPageUrl("Store")} className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        {/* Points Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-stone-900 to-stone-700 rounded-3xl p-8 text-white mb-8 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-10 w-32 h-32 bg-amber-400 rounded-full blur-2xl" />
            <div className="absolute bottom-4 right-10 w-32 h-32 bg-amber-300 rounded-full blur-2xl" />
          </div>
          <div className="relative">
            <Star className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-stone-400 text-sm uppercase tracking-widest mb-1">Your Points</p>
            {loadingPoints ? (
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400" />
            ) : (
              <p className="text-6xl font-bold text-amber-400">{myPoints.toLocaleString()}</p>
            )}
            <p className="text-stone-400 text-sm mt-3">
              🛍️ +50 pts per item ordered &nbsp;·&nbsp; 🎉 +1000 pts on orders over SAR 600
            </p>
          </div>
        </motion.div>

        {/* Redeemed Modal */}
        <AnimatePresence>
          {redeemedReward && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 mb-8 text-center"
            >
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg text-emerald-800 mb-1">Redeemed! 🎉</h3>
              <p className="text-emerald-700 text-sm mb-4">{redeemedReward.message || `You got: ${redeemedReward.title}!`}</p>
              <p className="text-stone-600 text-sm mb-2">Your promo code:</p>
              <div className="flex items-center justify-center gap-3 bg-white border border-emerald-200 rounded-xl px-4 py-3 mb-4">
                <span className="font-mono font-bold text-stone-900 text-lg tracking-widest">{redeemedReward.promo_code}</span>
                <button onClick={() => copyCode(redeemedReward.promo_code)} className="text-emerald-600 hover:text-emerald-800">
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-stone-500 mb-4">Copy this code and paste it in the promo code field at checkout. {redeemedReward.note || "No need to show anything — it will come with your order!"}</p>
              <Button onClick={() => setRedeemedReward(null)} variant="outline" className="rounded-xl">
                Close
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm Modal */}
        <AnimatePresence>
          {confirmReward && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6"
              onClick={() => setConfirmReward(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <span className="text-4xl">{confirmReward.emoji || "🎁"}</span>
                  <h3 className="font-bold text-lg text-stone-900 mt-2">Redeem {confirmReward.title}?</h3>
                  <p className="text-stone-500 text-sm mt-1">This will use <strong>{confirmReward.points_required.toLocaleString()} points</strong>. You have <strong>{myPoints.toLocaleString()}</strong>.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setConfirmReward(null)}>Cancel</Button>
                  <Button
                    className="flex-1 bg-stone-900 hover:bg-stone-800 rounded-xl"
                    disabled={redeemMutation.isPending}
                    onClick={() => redeemMutation.mutate(confirmReward)}
                  >
                    {redeemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Redeem"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rewards */}
        <h2 className="font-bold text-xl text-stone-900 mb-4">Available Rewards</h2>
        {loadingRewards ? (
          <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-stone-400" /></div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No rewards available yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rewards.map((reward) => {
              const canRedeem = myPoints >= reward.points_required;
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-2xl border p-5 flex items-center justify-between gap-4 ${
                    canRedeem ? "border-amber-200 shadow-sm" : "border-stone-100 opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{reward.emoji || "🎁"}</span>
                    <div>
                      <p className="font-semibold text-stone-900">{reward.title}</p>
                      <p className="text-sm text-stone-500">{reward.description}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-sm font-bold text-amber-600">{reward.points_required.toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setConfirmReward(reward)}
                    disabled={!canRedeem}
                    className={`rounded-xl shrink-0 ${canRedeem ? "bg-stone-900 hover:bg-stone-800" : "bg-stone-200 text-stone-400 cursor-not-allowed"}`}
                  >
                    Redeem
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-stone-400 text-center mt-8">
          Points are earned automatically when you place orders. Keep shopping to earn more! 🌟
        </p>
      </div>
    </div>
  );
}