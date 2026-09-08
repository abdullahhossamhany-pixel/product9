import { createClient } from '@base44/sdk';

const BASE_URL = "https://base44.app";
const APP_ID = import.meta.env.VITE_BASE44_APP_ID || "69b04058605ff145749e7bb0";

const sdkClient = createClient({
  appId: APP_ID,
  headers: {
    "api_key": import.meta.env.VITE_BASE44_API_KEY || "9368d1420c614c48a416df3d73c6be58"
  }
});

if (!sdkClient.auth) {
  sdkClient.auth = {};
}

// Redirect to Base44 login page
sdkClient.auth.redirectToLogin = (opts) => {
  const currentOrigin = window.location.origin;
  window.location.href = `${BASE_URL}/api/apps/auth/login?app_id=${APP_ID}&redirect_url=${encodeURIComponent(currentOrigin)}`;
};

// Force complete auth revocation and token cleanup
sdkClient.auth.logout = async () => {
  try {
    // 1. Force SDK internal session clearing if available
    if (typeof sdkClient.clearAuth === 'function') {
      sdkClient.clearAuth();
    }
    if (sdkClient.token) {
      sdkClient.token = null;
    }
  } catch (e) {
    console.error("SDK token cleanup error:", e);
  }

  // 2. Clear all local browser storage and authorization headers
  try {
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies across all paths
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  } catch (e) {}

  // 3. Force hard redirect to home page without cache
  window.location.replace("/");
};

// Suppress WebSocket errors from freezing UI
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
