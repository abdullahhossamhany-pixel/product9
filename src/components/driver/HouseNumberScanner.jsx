const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useRef, useState } from "react";

import { Camera, Loader2, ScanLine } from "lucide-react";

export default function HouseNumberScanner({ onResult }) {
  const [scanning, setScanning] = useState(false);
  const [reading, setReading] = useState(false);
  const [err, setErr] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stop = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const start = async () => {
    setErr("");
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setErr("Couldn't access the camera. Allow camera permission and try again.");
      stop();
    }
  };

  useEffect(() => () => stop(), []);

  const read = async () => {
    const video = videoRef.current;
    if (!video) return;
    setReading(true);
    setErr("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.8));
      const file = new File([blob], "house-number.jpg", { type: "image/jpeg" });
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      const res = await db.integrations.Core.InvokeLLM({
        prompt:
          "You are looking at a photo taken by a delivery driver of the house/villa they are standing in front of. " +
          "Read the house or villa number printed on the gate or wall. It is usually a letter followed by a hyphen and a number (e.g. O-18) or just a number. " +
          "Respond ONLY with that identifier as it appears. If unreadable, return an empty string.",
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: { house_number: { type: "string" } },
          required: ["house_number"],
        },
      });
      const detected = (res?.house_number || "").trim();
      stop();
      onResult({ detected, file_url });
    } catch {
      setErr("Could not read the house number. Hold steady and try again.");
    }
    setReading(false);
  };

  return (
    <div>
      {!scanning ? (
        <button
          onClick={start}
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white rounded-xl py-3 text-sm font-medium"
        >
          <Camera className="w-4 h-4" /> Open house-number scanner
        </button>
      ) : (
        <div>
          <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-3/4 h-24 border-2 border-white/80 rounded-xl" />
            </div>
            <ScanLine className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white/70" />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={read}
              disabled={reading}
              type="button"
              className="flex-1 flex items-center justify-center gap-2 bg-stone-900 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {reading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {reading ? "Reading…" : "Read house number"}
            </button>
            <button
              onClick={stop}
              type="button"
              className="px-4 border border-stone-200 rounded-xl text-sm text-stone-600"
            >
              Stop
            </button>
          </div>
        </div>
      )}
      {err && <p className="text-amber-600 text-xs mt-2">{err}</p>}
    </div>
  );
}