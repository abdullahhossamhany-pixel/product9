const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, User as UserIcon } from "lucide-react";

export default function ProfileSection({ user, profile, onSave }) {
  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [picture, setPicture] = useState(profile.profile_picture || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      setPicture(file_url);
    } catch {}
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    await onSave({ username, bio, profile_picture: picture });
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center">
          {picture ? <img src={picture} className="w-full h-full object-cover" alt="" /> : <UserIcon className="w-8 h-8 text-stone-400" />}
        </div>
        <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-stone-700 border border-stone-200 rounded-xl px-3 py-2 hover:bg-stone-50">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload photo
          <input type="file" accept="image/*" className="hidden" onChange={upload} />
        </label>
      </div>
      <div>
        <Label>Email</Label>
        <Input value={user.email || ""} disabled className="mt-1.5 rounded-xl bg-stone-50" />
      </div>
      <div>
        <Label>Username</Label>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" className="mt-1.5 rounded-xl" />
      </div>
      <div>
        <Label>Bio</Label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="A short bio" className="mt-1.5 rounded-xl" />
      </div>
      <Button onClick={save} disabled={saving} className="rounded-xl bg-stone-900 hover:bg-stone-800">
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Profile
      </Button>
    </div>
  );
}