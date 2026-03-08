import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { getConnInfo } from "@hono/node-server/conninfo";
import { logToGoogleSheet } from "../services/googleSheets.js";
import { sendPushHint } from "../services/notifications.js";
import { failedAttempts, rateLimits } from "../store/store.js";
import { handleFailure } from "../services/handleFailure.js";
const vaultApp = new Hono();

vaultApp.post("/", async (c) => {
  const visitorId = getCookie(c, "visitor_id") || "unknown";
  const info = getConnInfo(c);
  const ip =
    c.req.header("x-forwarded-for") || info?.remote?.address || "unknown";

  // SECURITY FIX: Basic Rate Limiting (Prevent Brute Force)
  let hits = rateLimits.get(ip) || 0;
  if (hits > 50)
    return c.json({ error: "Rate limit exceeded. Try again later." }, 429);
  rateLimits.set(ip, hits + 1);

  const origin = c.req.header("origin");
  const requestedBy = c.req.header("x-requested-with");
  // const userAgent = c.req.header["user-agent"] || "";
  const userAgent = c.req.header("user-agent") || "";
  const authToken = getCookie(c, "auth_token");

  // 1. Content-Type Check (Ensures they are sending JSON correctly)
  const contentType = c.req.header("content-type") || "";
  if (!contentType.includes("application/json")) {
    return handleFailure(
      "The ancient vault only reads the language of JSON. Your dialect is unrecognized.",
      415,
      "Content-Type",
      "Hint: Check your 'Content-Type' header. It must be application/json.",
      visitorId,
      ip,
      c,
    );
    // return c.json(
    //   {
    //     error:
    //       "The ancient vault only reads the language of JSON. Your dialect is unrecognized.",
    //   },
    //   415,
    // );
  }

  // 2. Anti-Tool Check
  if (
    userAgent.includes("PostmanRuntime") ||
    userAgent.includes("axios") ||
    userAgent.includes("curl")
  ) {
    return handleFailure(
      "The guardian recognizes the mechanical hum of automated tools. Disguise your User-Agent, shape-shifter.",
      400,
      "User-Agent",
      "Hint: The gatekeeper blocks You. Change your User-Agent header to look like a normal browser.",
      visitorId,
      ip,
      c,
    );
    // return c.json(
    //   {
    //     error:
    //       "The guardian recognizes the mechanical hum of automated tools. Disguise your ${'User-Agent'}, shape-shifter.",
    //   },
    //   400,
    // );
  }

  // 3. CORS & Custom Header Check
  if (origin !== "https://zenithratech.com") {
    return handleFailure(
      "You approach from a foreign land. Only those originating from the Zenithra realm may pass. Try with the correct 'Origin' header. Zenithratech.com",
      403,
      "Origin",
      "Hint: You must pretend to come from the inside. Set 'Origin' to https://zenithratech.com.",
      visitorId,
      ip,
      c,
    );
    // return c.json(
    //   {
    //     error:
    //       "You approach from a foreign land. Only those originating from the Zenithra realm may pass. Try with the correct 'Origin' header. Zenithratech.com",
    //   },
    //   403,
    // );
  }

  if (requestedBy !== "Intern") {
    return handleFailure(
      "Halt! The proud are turned away. Only the humblest of our ranks may grant you passage. Who requested your presence? You are Intern (Check your headers)",
      401,
      "Requested-With",
      "Hint: The cipher said to tell the Guardian it was the 'Intern'. Use the x-requested-with header.",
      visitorId,
      ip,
      c,
    );
    // return c.json(
    //   {
    //     error:
    //       "Halt! The proud are turned away. Only the humblest of our ranks may grant you passage. Who requested your presence? You are Intern (Check your headers)",
    //   },
    //   401,
    // );
  }
  // 4. The Reasoning Puzzle Token Check (Cookie)
  if (!authToken) {
    return await handleFailure(
      "You approach the gate empty-handed. Where is the Master Key (auth_token cookie)?",
      401,
      "Missing-Auth-Token",
      "Hint: You need to pass the cipher solution as a Cookie named 'auth_token'.",
      visitorId,
      ip,
      c,
    );
    // return c.json(
    //   {
    //     error:
    //       "You approach the gate empty-handed. Where is the Master Key (auth_token cookie)?",
    //   },
    //   401,
    // );
  }

  if (authToken !== "1349") {
    return handleFailure(
      "The gate groans, but remains shut. Your deductive reasoning is flawed. The ancestors weep at your incorrect key.",
      401,
      "Auth-Token",
      "Hint: Your cipher math is wrong. The final digit is 9. Put it in a Cookie.",
      visitorId,
      ip,
      c,
    );
    // const visitorId = getCookie(c, "visitor_id") || "unknown";
    // const ip = c.req.header("x-forwarded-for") || "unknown"; // Or use getConnInfo

    // // 1. Log to Google Sheets
    // logToGoogleSheet(visitorId, "Failed Cipher", ip, new Date().toISOString());

    // // 2. Increment the fail count
    // let currentFails = failedAttempts.get(visitorId) || 0;
    // currentFails += 1;
    // failedAttempts.set(visitorId, currentFails);

    // // 3. Trigger Notification on 3rd Fail!
    // if (currentFails === 3) {
    //   const sub = userSubscriptions.get(visitorId);
    //   if (sub) {
    //     const payload = JSON.stringify({
    //       title: "Zenithra Gatekeeper",
    //       body: "The cipher is tricky. Hint: The final digit is 9.",
    //     });

    //     // Beam the notification to the user's screen
    //     webpush
    //       .sendNotification(sub, payload)
    //       .catch((err) => console.error("Push failed:", err));

    //     // Log this action to Google Sheets too!
    //     logToGoogleSheet(
    //       visitorId,
    //       "Triggered Hint Notification",
    //       ip,
    //       new Date().toISOString(),
    //     );
    //   }
    // }
    // return c.json(
    //   {
    //     error:
    //       "The gate groans, but remains shut. Your deductive reasoning is flawed. The ancestors weep at your incorrect key.",
    //   },
    //   401,
    // );
  }

  let body;
  try {
    body = await c.req.json();
  } catch (err) {
    return await handleFailure(
      "Invalid JSON format. The vault cannot read this scroll.",
      400,
      "JSON-Parse",
      "Hint: Ensure your request body is valid, properly formatted JSON.",
      visitorId,
      ip,
      c,
    );
    // return c.json({ error: "Invalid JSON format." }, 400);
  }
  const payloadTimestamp = body.timestamp; // Checking the JSON body

  // 5. Dynamic Time-based Payload Check (Prevents Replay Attacks)
  if (!payloadTimestamp || typeof payloadTimestamp !== "number") {
    return handleFailure(
      "You are lost in time. The vault requires a temporal anchor ('timestamp' in your JSON payload).",
      400,
      "Timestamp",
      "Hint: Your request is missing the 'timestamp' field in the JSON body. Add it with the current time in Unix seconds.",
      visitorId,
      ip,
      c,
    );
    // return c.json(
    //   {
    //     error:
    //       "You are lost in time. The vault requires a temporal anchor ('timestamp' in your JSON payload).",
    //   },
    //   400,
    // );
  }

  const currentEpochSeconds = Math.floor(Date.now() / 1000);
  const timeDifference = currentEpochSeconds - payloadTimestamp;

  if (timeDifference < 0 || timeDifference > 300) {
    return await handleFailure(
      `Temporal rift collapsed. Your timestamp is out of sync by ${timeDifference} seconds. Your timestamp is out of sync by ${timeDifference} seconds. You must be swifter (within 120 seconds)`,
      401,
      "Timestamp-Bounds",
      "Hint: Your timestamp must be within 300 seconds of the current Unix epoch time.",
      visitorId,
      ip,
      c,
    );
    // return c.json(
    //   {
    //     error: `Temporal rift collapsed. Your timestamp is out of sync by ${timeDifference} seconds. You must be swifter (within 120 seconds).`,
    //   },
    //   401,
    // );
  }

  // If they pass ALL checks, grant access!

  return c.json(
    {
      success: true,
      message:
        "The ancient gates grind open. You have proven your worth as a Master of the Full-Stack arts. Claim your relic.",
      vault_url: "https://github.com/HarshGoyal2702/Final-Interview-Task",
      vault_password: "backend_master_2026",
    },
    200,
  );
});

export default vaultApp;
