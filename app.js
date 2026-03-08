import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { getCookie, setCookie } from "hono/cookie";
import { getConnInfo } from "@hono/node-server/conninfo";

import { CONFIG } from "./config.js";
import { userSubscriptions } from "./store.js";
import { logToGoogleSheet } from "./services/googleSheets.js";
import vaultRoutes from "./routes/vaultRoutes.js";

const app = new Hono();

// --- MOUNT ROUTERS ---
app.route("/v1/interview/vault", vaultRoutes);

// --- ROUTES ---
app.post("/v1/interview/subscribe", async (c) => {
  const visitorId = getCookie(c, "visitor_id");
  const subscription = await c.req.json();
  if (visitorId && subscription) {
    userSubscriptions.set(visitorId, subscription);
    return c.json({ success: true, message: "Subscription saved." });
  }
  return c.json({ error: "Missing visitor ID or subscription." }, 400);
});

app.get("/v1/interview/start", (c) => {
  let visitorId = getCookie(c, "visitor_id") || "visitor_" + Math.random().toString(36).substring(7);
  setCookie(c, "visitor_id", visitorId);
  const ip = c.req.header("x-forwarded-for") || getConnInfo(c)?.remote?.address || "unknown";
  
  logToGoogleSheet(visitorId, "Hit /start", ip, new Date().toISOString());

  return c.json({
    guardian_message: "Halt, traveler. You have found the hidden path...",
    directive: "Decode the ancient scroll...",
    payload: "VGhlIGdhdGVzIG9mIFplbml0aHJh..." // Truncated for brevity
  }, 200);
});

// --- FRONTEND ROUTES ---
app.get("/sw.js", (c) => {
  const swCode = `
    self.addEventListener('push', function(event) {
      const data = event.data.json();
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/814/814513.png'
      });
    });
  `;
  return c.text(swCode, 200, { "Content-Type": "application/javascript" });
});

app.get("/", (c) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Zenithra | Gatekeeper Status</title>
      <style>
        body {
          background-color: #0a0a0a;
          color: #00ffcc;
          font-family: 'Courier New', Courier, monospace;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          text-align: center;
        }
        .container {
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid #00ffcc;
          padding: 3rem;
          box-shadow: 0 0 20px rgba(0, 255, 204, 0.2);
          border-radius: 8px;
        }
        h1 { 
          margin-top: 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        p { color: #888; margin-bottom: 5px; }
        .status { 
          color: #00ff00; 
          font-weight: bold;
          animation: pulse 2s infinite;
        }
        .hint {
          margin-top: 2rem;
          font-size: 0.85em;
          color: #555;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>[ Zenithra Gatekeeper ]</h1>
        <p>Server Status: <span class="status">ONLINE & LISTENING</span></p>
        <p>Location: Zenithra HQ | OKHLA </p>
        <div class="hint">
          Seek the starting node path to begin the trial.<br>
          (Hint: Try adding <b>/v1/interview/start</b> to the URL)
        </div>
             <button onclick="enableAlerts()" style="margin-top: 20px; padding: 10px 20px; background: #00ffcc; color: #000; border: none; font-weight: bold; cursor: pointer;">Enable Mission Alerts</button>
      </div>
 </body>
    <script>
  const publicVapidKey = 'BPNqRdsOhEjloDoizUO2rrizJAUHzto70Ego_9e4u9WBWZKU90llC-TXOiRlEJqdIhgmhiq6nO2Rw-NdFJK9CoI';

  // Required helper function to convert the VAPID key
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray;
  }

  async function enableAlerts() {
    if ('serviceWorker' in navigator) {
      try {
        // 1. Hit start to ensure we have a visitor_id cookie
        await fetch('/v1/interview/start');
        
        // 2. Register the Service Worker
        const register = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        
        // 3. Ask user for permission and subscribe
        const subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        // 4. Send subscription to your Hono backend
        await fetch('/v1/interview/subscribe', {
          method: 'POST',
          body: JSON.stringify(subscription),
          headers: {'content-type': 'application/json'}
        });
        
        alert("Alerts Enabled! The Gatekeeper is watching.");
      } catch (err) {
        console.error("Subscription failed:", err);
      }
    } else {
      alert("Push notifications are not supported in this browser.");
    }
  }
</script>
    </html>
  `;

  return c.html(htmlContent);
});

// --- START SERVER ---
serve({ fetch: app.fetch, port: CONFIG.PORT });
console.log(`Zenithra Gatekeeper guarding port ${CONFIG.PORT}...`);