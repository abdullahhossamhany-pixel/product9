import { createClient } from '@base44/sdk';

const BASE_URL = "https://base44.app";
const APP_ID = import.meta.env.VITE_BASE44_APP_ID || "69b04058605ff145749e7bb0";

const sdkClient = createClient({
  appId: APP_ID,
  headers: {
    "api_key": import.meta.env.VITE_BASE44_API_KEY || "9368d1420c614c48a416df3d73c6be58"
  }
});

// Override logout to stay strictly on local Render domain
if (!sdkClient.auth) {
  sdkClient.auth = {};
}

sdkClient.auth.logout = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    
    // Expire local site cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/");
    });
  } catch (e) {
    console.error("Local logout error:", e);
  }

  // Force local reload to home page on Render
  window.location.href = "/";
};

// Suppress WebSocket errors from interrupting UI
if (sdkClient.socket) {
  sdkClient.socket.on?.('connect_error', () => {});
}

if (typeof window !== 'undefined') {
  window.base44 = sdkClient;
  window.__B44_DB__ = sdkClient;
  globalThis.__B44_DB__ = sdkClient;
}

export const db = sdkClient;
export const base44 = sdkClient;
export default sdkClient;
