const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminMessageBanner({ email }) {
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["store-admin-messages", email],
    queryFn: () =>
      db.entities.CustomerNotification.filter(
        { customer_email: email, is_read: false },
        "-created_date",
        5
      ),
    enabled: !!email,
  });

  if (!email || isLoading || dismissed || notes.length === 0) return null;
  const latest = notes[0];

  const dismiss = async () => {
    setDismissed(true);
    try {
      await db.entities.CustomerNotification.update(latest.id, { is_read: true });
      queryClient.invalidateQueries({ queryKey: ["store-admin-messages"] });
    } catch {}
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="max-w-7xl mx-auto px-6 mt-4"
      >
        <div className="flex items-start gap-3 bg-stone-900 text-white rounded-2xl px-4 py-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <MessageSquareText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {latest.title || "Message from Try Market"}
            </p>
            <p className="text-sm mt-0.5 break-words">{latest.message}</p>
          </div>
          <button
            onClick={dismiss}
            className="text-stone-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}