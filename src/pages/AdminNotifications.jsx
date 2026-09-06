const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function AdminNotifications() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const qc = useQueryClient();

  useEffect(() => { db.auth.me().then(setUser).catch(() => {}); }, []);
  const isAdmin = user?.role === "admin";

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => db.entities.Notification.list("-created_date", 200),
    enabled: !!isAdmin,
  });

  const filtered = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id) => {
    try { await db.entities.Notification.update(id, { is_read: true }); qc.invalidateQueries({ queryKey: ["admin-notifications"] }); }
    catch { toast.error("Could not update"); }
  };
  const markAllRead = async () => {
    try { await db.entities.Notification.updateMany({ is_read: false }, { $set: { is_read: true } }); qc.invalidateQueries({ queryKey: ["admin-notifications"] }); toast.success("All marked read"); }
    catch { toast.error("Could not update"); }
  };
  const remove = async (id) => {
    try { await db.entities.Notification.delete(id); qc.invalidateQueries({ queryKey: ["admin-notifications"] }); }
    catch { toast.error("Could not delete"); }
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-stone-500">Admins only</div>;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-2"><Bell className="w-7 h-7 text-stone-700" /> Notifications</h1>
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0} className="rounded-xl"><CheckCheck className="w-4 h-4 mr-2" /> Mark all read</Button>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-sm ${filter === "all" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"}`}>All ({notifications.length})</button>
          <button onClick={() => setFilter("unread")} className={`px-3 py-1.5 rounded-full text-sm ${filter === "unread" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"}`}>Unread ({unreadCount})</button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-stone-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center text-stone-400">No notifications.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => (
              <div key={n.id} className={`bg-white rounded-2xl border p-4 flex items-start justify-between gap-3 ${n.is_read ? "border-stone-100" : "border-amber-200 bg-amber-50/30"}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                    <Badge variant="outline" className="text-xs capitalize border-stone-200 text-stone-500">{n.type || "general"}</Badge>
                  </div>
                  <p className="text-sm text-stone-800">{n.message}</p>
                  <p className="text-xs text-stone-400 mt-1">{n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ""}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!n.is_read && <Button size="sm" variant="ghost" onClick={() => markRead(n.id)} className="rounded-lg text-xs">Mark read</Button>}
                  <Button size="sm" variant="ghost" onClick={() => remove(n.id)} className="rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}