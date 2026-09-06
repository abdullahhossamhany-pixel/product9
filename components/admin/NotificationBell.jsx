const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => db.entities.Notification.list("-created_date", 20),
    refetchInterval: 30000,
  });

  useEffect(() => {
    const unsubscribe = db.entities.Notification.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
    return unsubscribe;
  }, [queryClient]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleOpenChange = async (isOpen) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      await db.entities.Notification.updateMany(
        { is_read: false },
        { $set: { is_read: true } }
      );
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
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
            <div
              key={n.id}
              className={`px-3 py-2.5 border-b border-stone-50 last:border-0 ${
                !n.is_read ? "bg-stone-50" : ""
              }`}
            >
              <p className="text-sm text-stone-800">{n.message}</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ""}
              </p>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}