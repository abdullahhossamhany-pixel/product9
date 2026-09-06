const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { createPageUrl } from "@/utils";

export default function CustomerNotificationBell({ email }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ["customer-notifications", email],
    queryFn: () => db.entities.CustomerNotification.filter({ customer_email: email }, "-created_date", 20),
    enabled: !!email,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!email) return;
    const unsubscribe = db.entities.CustomerNotification.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["customer-notifications", email] });
    });
    return unsubscribe;
  }, [queryClient, email]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async () => {
    if (unreadCount === 0) return;
    await db.entities.CustomerNotification.updateMany(
      { customer_email: email, is_read: false },
      { $set: { is_read: true } }
    );
    queryClient.invalidateQueries({ queryKey: ["customer-notifications", email] });
  };

  const openNotification = async (n) => {
    if (!n.is_read) {
      try {
        await db.entities.CustomerNotification.update(n.id, { is_read: true });
        queryClient.invalidateQueries({ queryKey: ["customer-notifications", email] });
      } catch {}
    }
    setOpen(false);
    if (n.link) navigate(createPageUrl(n.link));
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) markRead();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl relative">
          <Bell className="w-5 h-5 text-stone-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-xl max-h-96 overflow-y-auto">
        <div className="px-3 py-2 border-b border-stone-100">
          <p className="font-semibold text-sm">Notifications</p>
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-stone-400 px-3 py-6 text-center">No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => openNotification(n)}
              className={`w-full text-left px-3 py-2.5 border-b border-stone-50 last:border-0 ${
                !n.is_read ? "bg-amber-50" : ""
              }`}
            >
              {n.title && <p className="text-sm font-semibold text-stone-900">{n.title}</p>}
              <p className="text-sm text-stone-700">{n.message}</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ""}
              </p>
            </button>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}