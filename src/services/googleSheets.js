import { CONFIG } from "../config/config.js";

export async function logToGoogleSheet(visitorId, status, ip, timestamp) {
  try {
    const safeIp = String(ip).substring(0, 50);
    await fetch(CONFIG.GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, status, ip:safeIp, timestamp }),
    });
    // Removed console.log here to keep terminal clean in production
  } catch (error) {
    console.error("Failed to log to Google Sheets:", error);
  }
}


