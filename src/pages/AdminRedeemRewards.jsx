const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Gift, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const EMPTY = { title: "", description: "", points_required: "", promo_code: "", message: "", emoji: "🎁", is_active: true };

export default function AdminRedeemRewards() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me().then(u => setIsAdmin(u.role === "admin")).catch(() => setIsAdmin(false));
  }, []);

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ["redeem-rewards-admin"],
    queryFn: () => db.entities.RedeemReward.list("points_required"),
    enabled: isAdmin === true,
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.RedeemReward.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redeem-rewards-admin"] });
      queryClient.invalidateQueries({ queryKey: ["redeem-rewards"] });
      toast.success("Reward created!");
      setForm(EMPTY);
      setAdding(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.RedeemReward.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redeem-rewards-admin"] });
      queryClient.invalidateQueries({ queryKey: ["redeem-rewards"] });
      toast.success("Reward deleted");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.points_required || !form.promo_code) {
      toast.error("Title, points, and promo code are required");
      return;
    }
    createMutation.mutate({ ...form, points_required: Number(form.points_required) });
  };

  if (isAdmin === null) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-stone-400" /></div>;
  if (!isAdmin) return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
      <EyeOff className="w-12 h-12 text-red-400" />
      <h2 className="text-xl font-bold">Access Denied</h2>
      <Button onClick={() => navigate(createPageUrl("Store"))} variant="outline" className="rounded-xl">Go to Store</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-stone-900">Redeem Rewards</h1>
              <p className="text-stone-500 text-sm">Manage what customers can redeem with points</p>
            </div>
          </div>
          <Button onClick={() => setAdding(!adding)} className="bg-stone-900 hover:bg-stone-800 rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Reward
          </Button>
        </div>

        {adding && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-100 p-6 mb-8 shadow-sm space-y-4">
            <h2 className="font-semibold text-stone-900">New Reward</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Emoji</Label>
                <Input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} className="rounded-xl mt-1" placeholder="🎁" />
              </div>
              <div>
                <Label className="text-xs">Points Required</Label>
                <Input type="number" value={form.points_required} onChange={e => setForm({ ...form, points_required: e.target.value })} className="rounded-xl mt-1" placeholder="1500" required />
              </div>
            </div>
            <div>
              <Label className="text-xs">Reward Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl mt-1" placeholder="Free Chipsy Tomato" required />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl mt-1" placeholder="Get a free Chipsy Tomato with your next order" />
            </div>
            <div>
              <Label className="text-xs">Promo Code (given on redeem)</Label>
              <Input value={form.promo_code} onChange={e => setForm({ ...form, promo_code: e.target.value.toUpperCase() })} className="rounded-xl mt-1 font-mono uppercase" placeholder="FREECHIPSY123" required />
            </div>
            <div>
              <Label className="text-xs">Message after redeeming</Label>
              <Input value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="rounded-xl mt-1" placeholder="You have a free Chipsy Tomato coming with your order!" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="rounded-xl flex-1" onClick={() => setAdding(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-stone-900 hover:bg-stone-800 rounded-xl flex-1">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Reward"}
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-stone-400" /></div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No rewards yet. Add one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rewards.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-stone-100 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{r.emoji || "🎁"}</span>
                  <div>
                    <p className="font-semibold text-stone-900">{r.title}</p>
                    <p className="text-sm text-stone-500">{r.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50">⭐ {r.points_required.toLocaleString()} pts</Badge>
                      <Badge variant="outline" className="text-xs font-mono text-stone-600">{r.promo_code}</Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost" size="icon"
                  className="text-stone-400 hover:text-red-500 shrink-0"
                  onClick={() => { if (confirm("Delete this reward?")) deleteMutation.mutate(r.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}