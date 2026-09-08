import { createClient } from '@base44/sdk';

const sdkClient = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID || "69b04058605ff145749e7bb0",
  headers: {
    "api_key": import.meta.env.VITE_BASE44_API_KEY || "9368d1420c614c48a416df3d73c6be58"
  }
});

if (!sdkClient.auth) {
  sdkClient.auth = {};
}

if (typeof sdkClient.auth.redirectToLogin !== 'function') {
  sdkClient.auth.redirectToLogin = (opts) => {
    if (typeof sdkClient.auth.login === 'function') {
      return sdkClient.auth.login(opts);
    }
    window.location.href = '/login';
  };
}

// Attach to global window scope so components looking for global instances don't hang
if (typeof window !== 'undefined') {
  window.base44 = sdkClient;
  window.__B44_DB__ = sdkClient;
  globalThis.__B44_DB__ = sdkClient;
}

export const db = sdkClient;
export const base44 = sdkClient;
export default sdkClient;
