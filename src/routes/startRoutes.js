import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { getConnInfo } from "@hono/node-server/conninfo";
import { logToGoogleSheet } from "../services/googleSheets.js";
import { CONFIG } from "../config/config.js";
const startApp = new Hono();

startApp.get("/", (c) => {
  let visitorId =
    getCookie(c, "visitor_id");

  if (!visitorId) {
    visitorId = "visitor_" + Math.random().toString(36).substring(7);
    // SECURITY FIX: Secure cookies prevent XSS theft
    setCookie(c, "visitor_id", visitorId, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
  }
  // setCookie(c, "visitor_id", visitorId);
  const info = getConnInfo(c);
  // Log to Google Sheets (Non-blocking so it doesn't slow down the response)
  const ip =
    c.req.header("x-forwarded-for") || info.remote.address || "unknown";
  // const ip = c.req.header("x-forwarded-for") || "unknown";
  logToGoogleSheet(visitorId, "Hit /start", ip, new Date().toISOString());

  // Base64 Encoded Message:
  // "The gates of Zenithra are sealed. Only a trusted seeker may enter. To forge the Master Key, solve the riddle of the ancients: I am a 4-digit cipher. My first digit is one-third of my second. My third unites the first two in sum. My final digit is three times my second. Speak this cipher as your auth_token."
  //   const cipher = "VGhlIGdhdGVzIG9mIFplbml0aHJhIGFyZSBzZWFsZWQuIE9ubHkgYSB0cnVzdGVkIHNlZWtlciBtYXkgZW50ZXIuIFRvIGZvcmdlIHRoZSBNYXN0ZXIgS2V5LCBzb2x2ZSB0aGUgcmlkZGxlIG9mIHRoZSBhbmNpZW50czogSSBhbSBhIDQtZGlnaXQgY2lwaGVyLiBNeSBmaXJzdCBkaWdpdCBpcyBvbmUtdGhpcmQgb2YgbXkgc2Vjb25kLiBNeSB0aGlyZCB1bml0ZXMgdGhlIGZpcnN0IHR3byBpbiBzdW0uIE15IGZpbmFsIGRpZ2l0IGlzIHRocmVlIHRpbWVzIG15IHNlY29uZC4gU3BlYWsgdGhpcyBjaXBoZXIgYXMgeW91ciBhdXRoX3Rva2VuLg==";

  // "The gates of Zenithra are sealed. Only a trusted seeker may enter. To forge the Master Key, solve the riddle of the ancients: I am a 4-digit cipher. My first digit is one-third of my second. My third unites the first two in sum. My final digit is three times my second. Speak this cipher as your auth_token. The Guardian will ask who requested your presence. Tell them it was the 'Intern'."
  // const cipher =
  // "VGhlIGdhdGVzIG9mIFplbml0aHJhIGFyZSBzZWFsZWQuIE9ubHkgYSB0cnVzdGVkIHNlZWtlciBtYXkgZW50ZXIuIFRvIGZvcmdlIHRoZSBNYXN0ZXIgS2V5LCBzb2x2ZSB0aGUgcmlkZGxlIG9mIHRoZSBhbmNpZW50czogSSBhbSBhIDQtZGlnaXQgY2lwaGVyLiBNeSBmaXJzdCBkaWdpdCBpcyBvbmUtdGhpcmQgb2YgbXkgc2Vjb25kLiBNeSB0aGlyZCB1bml0ZXMgdGhlIGZpcnN0IHR3byBpbiBzdW0uIE15IGZpbmFsIGRpZ2l0IGlzIHRocmVlIHRpbWVzIG15IHNlY29uZC4gU3BlYWsgdGhpcyBjaXBoZXIgYXMgeW91ciBhdXRoX3Rva2VuLiBUaGUgR3VhcmRpYW4gd2lsbCBhc2sgd2hvIHJlcXVlc3RlZCB5b3VyIHByZXNlbmNlLiBUZWxsIHRoZW0gaXQgd2FzIHRoZSAnSW50ZXJuJy4=";
  const cipher = CONFIG.CIPHER_KEY;
  return c.json(
    {
      guardian_message:
        "Halt, traveler. You have found the hidden path, but the door is barred.",
      directive:
        "Decode the ancient scroll (payload) to find your auth_token. Then, POST to /v1/interview/vault. Warning: The vault only accepts the JSON dialect, requires a temporal anchor ('timestamp' in Unix seconds), and immediately rejects soulless machines (default API clients).",
      payload: cipher,
    },
    200,
  );
});

export default startApp;
