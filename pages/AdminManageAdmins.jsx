const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, EyeOff, ShieldCheck, UserPlus, Ban, UserX, Crown, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function AdminManageAdmins() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [banEmail, setBanEmail] = useState("");
  const [banLoading, setBanLoading] = useState(false);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    db.auth.me().then(u => { setCurrentUser(u); setIsAdmin(u.role === "admin"); }).catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (isAdmin) {
      db.entities.User.list().then(users => {
        setBannedUsers(users.filter(u => u.is_banned === true));
      });
    }
  }, [isAdmin]);

  const banUser = async (e) => {
    e.preventDefault();
    if (!banEmail.trim()) return;
    setBanLoading(true);
    const users = await db.entities.User.list();
    const target = users.find(u => u.email.toLowerCase() === banEmail.trim().toLowerCase());
    if (!target) {
      toast.error("No user found with that email.");
      setBanLoading(false);
      return;
    }
    await db.entities.User.update(target.id, { is_banned: true });
    setBannedUsers(prev => [...prev.filter(u => u.id !== target.id), { ...target, is_banned: true }]);
    toast.success(`${banEmail} has been banned.`);
    setBanEmail("");
    setBanLoading(false);
  };

  const transferOwnership = async (e) => {
    e.preventDefault();
    if (!transferEmail.trim()) return;
    if (transferEmail.trim().toLowerCase() === currentUser?.email?.toLowerCase()) {
      toast.error("You cannot transfer ownership to yourself.");
      return;
    }
    setTransferLoading(true);
    const users = await db.entities.User.list();
    const target = users.find(u => u.email.toLowerCase() === transferEmail.trim().toLowerCase());
    if (!target) {
      toast.error("No user found with that email. They must sign up first.");
      setTransferLoading(false);
      return;
    }
    // Make target admin, demote self to user
    await db.entities.User.update(target.id, { role: "admin" });
    await db.auth.updateMe({ role: "user" });
    toast.success(`Ownership transferred to ${transferEmail}. You are no longer an admin.`);
    setTransferLoading(false);
    setConfirmTransfer(false);
    navigate(createPageUrl("Store"));
  };

  const unbanUser = async (userId, userEmail) => {
    await db.entities.User.update(userId, { is_banned: false });
    setBannedUsers(prev => prev.filter(u => u.id !== userId));
    toast.success(`${userEmail} has been unbanned.`);
  };

  const makeAdmin = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const users = await db.entities.User.list();
    const target = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!target) {
      toast.error("No user found with that email. They must sign up first.");
      setLoading(false);
      return;
    }
    await db.entities.User.update(target.id, { role: "admin" });
    toast.success(`${email} is now an admin!`);
    setEmail("");
    setLoading(false);
  };

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-stone-400" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <EyeOff className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Access Denied</h2>
        <p className="text-stone-500">Only administrators can access this page.</p>
        <Button onClick={() => navigate(createPageUrl("Store"))} variant="outline" className="rounded-xl mt-2">Go to Store</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Manage Admins</h1>
            <p className="text-stone-500 text-sm">Grant admin access by email</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <form onSubmit={makeAdmin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-stone-700 block mb-1.5">User Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="rounded-xl"
                required
              />
              <p className="text-xs text-stone-400 mt-1.5">The user must already have an account in the app.</p>
            </div>
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-stone-900 hover:bg-stone-800 rounded-xl h-11"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Make Admin
            </Button>
          </form>
        </div>

        {/* Transfer Ownership */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900">Transfer Ownership</h2>
              <p className="text-stone-500 text-sm">Make another user the admin and step down</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">This will make the other user an admin and remove your admin access. You will be redirected to the store.</p>
            </div>
            {!confirmTransfer ? (
              <form onSubmit={e => { e.preventDefault(); setConfirmTransfer(true); }} className="flex gap-2">
                <Input
                  type="email"
                  value={transferEmail}
                  onChange={e => setTransferEmail(e.target.value)}
                  placeholder="newowner@example.com"
                  className="rounded-xl"
                  required
                />
                <Button type="submit" disabled={!transferEmail.trim()} className="bg-amber-500 hover:bg-amber-600 rounded-xl whitespace-nowrap">
                  <Crown className="w-4 h-4 mr-1" /> Transfer
                </Button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-stone-700">Are you sure you want to transfer ownership to <strong>{transferEmail}</strong>?</p>
                <div className="flex gap-2">
                  <Button
                    onClick={transferOwnership}
                    disabled={transferLoading}
                    className="bg-amber-500 hover:bg-amber-600 rounded-xl flex-1"
                  >
                    {transferLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Yes, Transfer
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmTransfer(false)} className="rounded-xl flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ban Users */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <Ban className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900">Ban Users</h2>
              <p className="text-stone-500 text-sm">Prevent users from placing orders</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
            <form onSubmit={banUser} className="flex gap-2">
              <Input
                type="email"
                value={banEmail}
                onChange={e => setBanEmail(e.target.value)}
                placeholder="user@example.com"
                className="rounded-xl"
                required
              />
              <Button
                type="submit"
                disabled={banLoading || !banEmail.trim()}
                className="bg-red-600 hover:bg-red-700 rounded-xl whitespace-nowrap"
              >
                {banLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4 mr-1" />}
                Ban
              </Button>
            </form>

            {bannedUsers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Banned Users</p>
                <div className="space-y-2">
                  {bannedUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <UserX className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-stone-700">{u.email}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unbanUser(u.id, u.email)}
                        className="rounded-lg text-xs h-7"
                      >
                        Unban
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}