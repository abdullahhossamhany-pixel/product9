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

// Redirect to Base44 auth login page
sdkClient.auth.redirectToLogin = (opts) => {
  const currentOrigin = window.location.origin;
  window.location.href = `${BASE_URL}/api/apps/auth/login?app_id=${APP_ID}&redirect_url=${encodeURIComponent(currentOrigin)}`;
};

// Clear session on Base44 and redirect back to your app homepage
sdkClient.auth.logout = () => {
  const currentOrigin = window.location.origin;
  window.location.href = `${BASE_URL}/api/apps/auth/logout?app_id=${APP_ID}&redirect_url=${encodeURIComponent(currentOrigin)}`;
};

// Suppress WebSocket reconnection errors from freezing UI
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
