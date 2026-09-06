const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { BellRing, X } from "lucide-react";

export default function AdminOrderNotifier() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [started, setStarted] = useState(false);
  const audioRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Start an audio-enabled session after first user interaction (browser autoplay policy)
  useEffect(() => {
    const startup = () => {
      setStarted(true);
      // Resume AudioContext after a gesture so the alarm can actually sound
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!audioRef.current) audioRef.current = new Ctx();
        if (audioRef.current.state === "suspended") audioRef.current.resume();
      } catch {}
    };
    window.addEventListener("pointerdown", startup, { once: true });
    window.addEventListener("keydown", startup, { once: true });
    return () => {
      window.removeEventListener("pointerdown", startup);
      window.removeEventListener("keydown", startup);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try { audioRef.current?.close(); } catch {}
    };
  }, []);

  // Realtime: fires the moment an order is created, no refresh needed
  useEffect(() => {
    let ready = false;
    const timer = setTimeout(() => { ready = true; }, 2000);
    const unsubscribe = db.entities.Order.subscribe((event) => {
      if (!ready || event.type !== "create") return;
      setPendingOrders((prev) => [
        { id: event.data.id, data: event.data, ts: Date.now() },
        ...prev,
      ]);
    });
    return () => { clearTimeout(timer); unsubscribe(); };
  }, []);

  const hasAlarm = pendingOrders.length > 0;

  // Loop a loud alarm tone while there are pending (un-acknowledged) orders
  useEffect(() => {
    if (!hasAlarm) return;
    let stopped = false;
    let ctx = audioRef.current;

    const ensureCtx = () => {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!ctx) { ctx = new Ctx(); audioRef.current = ctx; }
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
      } catch { return null; }
    };

    let intervalId;
    const playBurst = () => {
      const c = ensureCtx();
      if (!c) return;
      const t = c.currentTime;
      const notes = [880, 990, 880, 660];
      notes.forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sawtooth";
        osc.connect(gain);
        gain.connect(c.destination);
        osc.frequency.value = freq;
        const start = t + i * 0.18;
        gain.gain.setValueAtTime(0.9, start);
        gain.gain.exponentialRampToValueAtTime(0.02, start + 0.16);
        osc.start(start);
        osc.stop(start + 0.16);
      });
    };

    setStarted(true);
    playBurst();
    intervalId = setInterval(() => { if (!stopped) playBurst(); }, 1100);

    return () => {
      stopped = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [hasAlarm]);

  const acknowledgeAll = () => setPendingOrders([]);

  const newest = pendingOrders[0];

  return (
    <AnimatePresence>
      {hasAlarm && (
        <motion.div
          key="alarm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Pulsing red backdrop */}
          <motion.div
            className="absolute inset-0 bg-red-600"
            animate={{ opacity: [0.78, 0.55, 0.78] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Checker strobe */}
          <motion.div
            className="absolute inset-0 mix-blend-overlay"
            style={{ background: "repeating-linear-gradient(45deg, transparent 0 24px, rgba(255,255,255,0.15) 24px 48px)" }}
            animate={{ opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative z-10 text-center text-white px-6 max-w-lg">
            <motion.div
              animate={{ scale: [1, 1.25, 1], rotate: [0, -12, 12, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
              className="w-28 h-28 mx-auto mb-6 rounded-3xl bg-white/15 flex items-center justify-center shadow-2xl"
            >
              <BellRing className="w-16 h-16 text-white" />
            </motion.div>

            <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-3 drop-shadow-lg">
              NEW ORDER!
            </h1>
            <p className="text-xl font-semibold mb-1 opacity-90">
              {newest?.data?.customer_name || newest?.data?.customer_email || "Customer"}
            </p>
            <p className="text-2xl font-bold mb-6">
              SAR {(newest?.data?.total || 0).toFixed(2)}
              {newest?.data?.payment_method === "visa" ? " · 💳 Visa" : " · 💵 Cash"}
            </p>
            {pendingOrders.length > 1 && (
              <p className="mb-4 text-sm bg-white/20 inline-block px-3 py-1 rounded-full">
                {pendingOrders.length} new orders waiting
              </p>
            )}

            <div className="flex items-center justify-center gap-3 mt-2">
              <button
                onClick={acknowledgeAll}
                className="h-14 px-10 rounded-2xl bg-white text-red-700 font-bold text-lg shadow-xl hover:bg-red-50 transition-colors"
              >
                Stop Alarm
              </button>
            </div>

            {!started && (
              <p className="mt-6 text-sm text-white/80 bg-black/20 rounded-lg px-3 py-2 inline-block">
                Tap anywhere to enable the alarm sound 🔊
              </p>
            )}
          </div>

          {/* Close a single order quickly */}
          <button
            onClick={acknowledgeAll}
            className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            aria-label="Dismiss alarm"
          >
            <X className="w-6 h-6" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}