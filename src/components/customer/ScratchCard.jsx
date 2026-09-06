import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * ScratchCard — a scratch-to-reveal gift card.
 * @param {string} code The secret code hidden under the scratch layer
 * @param {string} amountLabel e.g. "SAR 100.00"
 * @param {string} brand Brand name shown on the card (e.g. "Chipso")
 * @param {() => void} onReveal Called once the code is revealed
 */
export default function ScratchCard({ code, amountLabel, brand = "Try Market", onReveal }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const drawingRef = useRef(false);
  const revealedRef = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const SIZE = 240; // px square scratch area sized via CSS

  const drawScratchLayer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = SIZE * ratio;
    canvas.height = SIZE * ratio;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    // metallic base
    const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    grad.addColorStop(0, "#cbd5e1");
    grad.addColorStop(0.5, "#94a3b8");
    grad.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#475569";
    ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🖐️ Scratch here to reveal", SIZE / 2, SIZE / 2 - 8);
    ctx.fillStyle = "#64748b";
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillText("your gift card code", SIZE / 2, SIZE / 2 + 12);
  };

  useEffect(() => {
    drawScratchLayer();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return {
        x: ((touch.clientX - rect.left) / rect.width) * SIZE,
        y: ((touch.clientY - rect.top) / rect.height) * SIZE,
      };
    };

    const scratch = (ctx, x, y) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
    };

    const checkReveal = (ctx) => {
      if (revealedRef.current) return;
      const { width, height } = canvas;
      const img = ctx.getImageData(0, 0, width, height).data;
      let cleared = 0;
      const step = 2000;
      for (let i = 3; i < img.length; i += step * 4) {
        if (img[i] === 0) cleared++;
      }
      const total = Math.floor(img.length / 4 / step);
      if (cleared / total > 0.32) {
        revealedRef.current = true;
        setRevealed(true);
        ctx.clearRect(0, 0, width, height);
        onReveal?.();
      }
    };

    const start = (e) => {
      e.preventDefault();
      drawingRef.current = true;
      const ctx = canvas.getContext("2d");
      const { x, y } = getPos(e);
      scratch(ctx, x, y);
    };
    const move = (e) => {
      if (!drawingRef.current) return;
      e.preventDefault();
      const ctx = canvas.getContext("2d");
      const { x, y } = getPos(e);
      scratch(ctx, x, y);
      checkReveal(ctx);
    };
    const end = (e) => {
      drawingRef.current = false;
      const ctx = canvas.getContext("2d");
      checkReveal(ctx);
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div
      ref={wrapperRef}
      className="relative rounded-2xl overflow-hidden shadow-lg mx-auto select-none"
      style={{
        width: SIZE,
        maxWidth: "100%",
        aspectRatio: "3 / 2",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
      }}
    >
      {/* Card body */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-400">Gift Card</p>
            <p className="text-lg font-bold leading-tight">{brand}</p>
          </div>
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>

        <div>
          <p className="text-xs text-stone-400">Value</p>
          <p className="text-2xl font-extrabold">{amountLabel}</p>
        </div>

        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-stone-500">Secret Code</p>
          <div className="mt-1 min-h-[24px]">
            {revealed ? (
              <button
                onClick={copyCode}
                className="font-mono text-lg font-bold tracking-wider text-amber-300 hover:underline"
              >
                {copied ? "Copied!" : code}
              </button>
            ) : (
              <span className="font-mono text-lg tracking-widest text-stone-600">•••• ••••</span>
            )}
          </div>
        </div>
      </div>

      {/* Scratch layer */}
      {!revealed && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-pointer touch-none"
        />
      )}
    </div>
  );
}