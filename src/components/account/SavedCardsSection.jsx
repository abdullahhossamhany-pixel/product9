import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, CreditCard } from "lucide-react";

export default function SavedCardsSection({ profile, onSave }) {
  const [list, setList] = useState(profile.saved_cards || []);
  const [nickname, setNickname] = useState("");
  const [last4, setLast4] = useState("");

  const add = () => {
    if (last4.trim().length < 4) return;
    setList([...list, { nickname: nickname.trim() || "Card", last4: last4.trim().slice(-4) }]);
    setNickname("");
    setLast4("");
  };
  const remove = (i) => setList(list.filter((_, idx) => idx !== i));

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
      {list.length === 0 && <p className="text-sm text-stone-400">No saved cards yet.</p>}
      {list.map((c, i) => (
        <div key={i} className="flex items-center justify-between border border-stone-100 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-stone-500" />
            <p className="text-sm text-stone-700">{c.nickname} •••• {c.last4}</p>
          </div>
          <button onClick={() => remove(i)} className="text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Nickname</Label>
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Visa" className="mt-1.5 rounded-xl" />
        </div>
        <div>
          <Label>Last 4 digits</Label>
          <Input value={last4} onChange={(e) => setLast4(e.target.value)} maxLength={4} placeholder="1234" className="mt-1.5 rounded-xl" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={add} variant="outline" className="rounded-xl"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        <Button onClick={() => onSave({ saved_cards: list })} className="rounded-xl bg-stone-900 hover:bg-stone-800">Save Cards</Button>
      </div>
      <p className="text-xs text-stone-400">For your security, we only store a nickname and the last 4 digits.</p>
    </div>
  );
}