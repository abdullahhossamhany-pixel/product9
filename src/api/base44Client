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

// Force redirection to remote Base44 authentication login endpoint
sdkClient.auth.redirectToLogin = (opts) => {
  const currentOrigin = window.location.origin;
  window.location.href = `${BASE_URL}/api/apps/auth/login?app_id=${APP_ID}&redirect_url=${encodeURIComponent(currentOrigin)}`;
};

// Absolute session destruction logic on logout
sdkClient.auth.logout = () => {
  try {
    // Clear all storage mechanisms
    localStorage.clear();
    sessionStorage.clear();

    // Clear all visible cookies across paths and domains
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  } catch (err) {
    console.error("Session cleanup error:", err);
  }

  // Hard redirect to the Base44 remote logout endpoint to clear backend server session
  const currentOrigin = window.location.origin;
  window.location.href = `${BASE_URL}/api/apps/auth/logout?app_id=${APP_ID}&redirect_url=${encodeURIComponent(currentOrigin)}`;
};

// Prevent socket errors from crashing or freezing UI
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
