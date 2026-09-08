import { createClient } from '@base44/sdk';

const BASE_URL = "https://base44.app";
const APP_ID = import.meta.env.VITE_BASE44_APP_ID || "69b04058605ff145749e7bb0";

const sdkClient = createClient({
  appId: APP_ID,
  headers: {
    "api_key": import.meta.env.VITE_BASE44_API_KEY || "9368d1420c614c48a416df3d73c6be58"
  }
});

// Store reference to original SDK logout if available
const originalLogout = sdkClient.auth?.logout;

if (!sdkClient.auth) {
  sdkClient.auth = {};
}

// Direct login to Base44 auth endpoint
sdkClient.auth.redirectToLogin = (opts) => {
  const currentOrigin = window.location.origin;
  window.location.href = `${BASE_URL}/api/apps/auth/login?app_id=${APP_ID}&redirect_url=${encodeURIComponent(currentOrigin)}`;
};

// Full SDK + Remote Session Logout
sdkClient.auth.logout = async () => {
  try {
    // 1. Call original SDK logout method if it exists to clear internal SDK cache
    if (typeof originalLogout === 'function') {
      await originalLogout.call(sdkClient.auth).catch(() => {});
    }
  } catch (e) {
    console.error("SDK internal logout error:", e);
  } finally {
    // 2. Wipe local browser storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}

    // 3. Force browser redirection to Base44 logout route to terminate remote session cookies
    const currentOrigin = window.location.origin;
    window.location.href = `${BASE_URL}/api/apps/auth/logout?app_id=${APP_ID}&redirect_url=${encodeURIComponent(currentOrigin)}`;
  }
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
