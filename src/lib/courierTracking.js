const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


// Module-level state so the geolocation watch keeps running across page
// navigations within the app (it only stops on a hard refresh/close).
let watchId = null;
let activeOrderId = null;

export function isSharingLocation(orderId) {
  return activeOrderId === orderId && watchId !== null;
}

export function startSharingLocation(orderId, onError) {
  if (!navigator.geolocation) {
    onError?.("Location sharing is not supported on this device");
    return;
  }
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }
  activeOrderId = orderId;
  watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      await db.entities.Order.update(orderId, {
        courier_lat: pos.coords.latitude,
        courier_lng: pos.coords.longitude,
        tracking_active: true,
        last_location_update: new Date().toISOString(),
      });
    },
    () => onError?.("Could not access your location"),
    { enableHighAccuracy: true, maximumAge: 5000 }
  );
}

export async function stopSharingLocation(orderId) {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  activeOrderId = null;
  await db.entities.Order.update(orderId, { tracking_active: false });
}