import { createClient } from '@base44/sdk';

export const db = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID || "69b04058605ff145749e7bb0",
  headers: {
    "api_key": import.meta.env.VITE_BASE44_API_KEY || "9368d1420c614c48a416df3d73c6be58"
  }
});

export const base44 = db;
export default db;
