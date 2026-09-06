import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, Loader2 } from "lucide-react";

export default function OrderScanner({ onDetected }) {
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [err, setErr] = useState("");
  const instRef = useRef(null);

  const stop = async () => {
    if (instRef.current) {
      try {
        await instRef.current.stop();
        await instRef.current.clear();
      } catch {}
      instRef.current = null;
    }
    setScanning(false);
  };

  const waitForElement = (id, timeout = 2000) =>
    new Promise((resolve, reject) => {
      const existing = document.getElementById(id);
      if (existing) return resolve(existing);
      const t0 = Date.now();
      const tick = () => {
        const el = document.getElementById(id);
        if (el) return resolve(el);
        if (Date.now() - t0 > timeout) return reject(new Error("timeout"));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

  const start = async () => {
    setErr("");
    setStarting(true);
    setScanning(true);
    try {
      await waitForElement("driver-qr-region");
      const inst = new Html5Qrcode("driver-qr-region");
      instRef.current = inst;
      await inst.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 260 },
        (decoded) => {
          stop();
          onDetected(decoded);
        },
        () => {}
      );
    } catch (e) {
      const name = e?.name || "";
      if (name === "NotAllowedError") {
        setErr("Camera permission was blocked. Tap the lock icon in the address bar, allow the camera, then tap Scan again.");
      } else {
        setErr("Couldn't access the camera. Allow camera permission (or enter the order below).");
      }
      setScanning(false);
      stop();
    }
    setStarting(false);
  };

  useEffect(() => () => { stop(); }, []);

  return (
    <div>
      {!scanning ? (
        <button
          onClick={start}
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white rounded-xl py-3 text-sm font-medium"
        >
          <Camera className="w-4 h-4" /> Scan order QR
        </button>
      ) : (
        <div>
          <div id="driver-qr-region" className="w-full max-w-sm rounded-xl overflow-hidden bg-black aspect-square" />
          <button
            onClick={stop}
            type="button"
            className="w-full mt-2 flex items-center justify-center gap-2 border border-stone-200 rounded-xl py-2 text-sm text-stone-600"
          >
            {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CameraOff className="w-4 h-4" />} Stop
          </button>
        </div>
      )}
      {err && <p className="text-amber-600 text-xs mt-2">{err}</p>}
    </div>
  );
}