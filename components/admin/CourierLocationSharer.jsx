import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";
import { toast } from "sonner";
import { isSharingLocation, startSharingLocation, stopSharingLocation } from "@/lib/courierTracking";

export default function CourierLocationSharer({ order }) {
  const [sharing, setSharing] = useState(isSharingLocation(order.id) || !!order.tracking_active);

  useEffect(() => {
    setSharing(isSharingLocation(order.id) || !!order.tracking_active);
  }, [order.id, order.tracking_active]);

  const start = () => {
    startSharingLocation(order.id, (msg) => toast.error(msg));
    setSharing(true);
    toast.success("Sharing your live location with the customer");
  };

  const stop = async () => {
    await stopSharingLocation(order.id);
    setSharing(false);
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={sharing ? "outline" : "default"}
      onClick={sharing ? stop : start}
      className={`rounded-xl gap-1.5 text-xs ${sharing ? "border-emerald-300 text-emerald-700" : "bg-stone-900 hover:bg-stone-800"}`}
    >
      <Navigation className="w-3.5 h-3.5" />
      {sharing ? "Stop Sharing Location" : "Share My Location"}
    </Button>
  );
}