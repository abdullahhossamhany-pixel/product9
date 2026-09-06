const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Truck } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const courierIcon = new L.DivIcon({
  html: '<div style="background:#1c1917;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🚚</div>',
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function LiveTrackingMap({ order }) {
  const [position, setPosition] = useState(
    order.courier_lat && order.courier_lng ? [order.courier_lat, order.courier_lng] : null
  );

  useEffect(() => {
    if (!order.tracking_active) return;
    const poll = async () => {
      const fresh = await db.entities.Order.get(order.id);
      if (fresh?.courier_lat && fresh?.courier_lng) {
        setPosition([fresh.courier_lat, fresh.courier_lng]);
      }
    };
    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [order.id, order.tracking_active]);

  if (!order.tracking_active || !position) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-stone-200 mt-3">
      <div className="bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 flex items-center gap-1.5 border-b border-emerald-100">
        <Truck className="w-3.5 h-3.5" /> Your delivery is on the way — live location
      </div>
      <div style={{ height: 220 }}>
        <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <Marker position={position} icon={courierIcon}>
            <Popup>Delivery courier</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}