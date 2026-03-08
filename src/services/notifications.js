import webpush from "web-push";
import { CONFIG } from "../config/config.js";
import { userSubscriptions } from "../store/store.js";

// Initialize Web Push
webpush.setVapidDetails(
  `mailto:${CONFIG.VAPID.email}`, // Put your actual email here
  CONFIG.VAPID.publicKey,
  CONFIG.VAPID.privateKey,
);

export async function sendPushHint(visitorId, hintMessage) {
  const sub = userSubscriptions.get(visitorId);
  if (sub) {
    const payload = JSON.stringify({
      title: "Zenithra Gatekeeper Alert",
      body: hintMessage,
    });
    try {
      await webpush.sendNotification(sub, payload);
    } catch (err) {
      if (err.statusCode === 410) userSubscriptions.delete(visitorId); // Clean up revoked permissions
      console.error("Push failed:", err);
    }
  }
}
