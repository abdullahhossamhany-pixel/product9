import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";

export default function AddressBookSection({ profile, onSave }) {
  const [list, setList] = useState(profile.address_book || []);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");

  const add = () => {
    if (!address.trim()) return;
    setList([...list, { label: label.trim() || `Address ${list.length + 1}`, address: address.trim() }]);
    setLabel("");
    setAddress("");
  };
  const remove = (i) => setList(list.filter((_, idx) => idx !== i));

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
      {list.length === 0 && <p className="text-sm text-stone-400">No saved addresses yet.</p>}
      {list.map((a, i) => (
        <div key={i} className="flex items-start justify-between gap-3 border border-stone-100 rounded-xl p-3">
          <div>
            <p className="text-sm font-semibold text-stone-900">{a.label}</p>
            <p className="text-sm text-stone-500">{a.address}</p>
          </div>
          <button onClick={() => remove(i)} className="text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Home" className="mt-1.5 rounded-xl" />
        </div>
        <div>
          <Label>Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Villa O-18, Retal Compound" className="mt-1.5 rounded-xl" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={add} variant="outline" className="rounded-xl"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        <Button onClick={() => onSave({ address_book: list })} className="rounded-xl bg-stone-900 hover:bg-stone-800">Save Addresses</Button>
      </div>
    </div>
  );
}