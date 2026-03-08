
import { logToGoogleSheet } from "./googleSheets.js";
import { sendPushHint } from "./notifications.js";
import { failedAttempts, rateLimits } from "../store/store.js";
export const handleFailure = async (
  errorMsg,
  statusCode,
  errorType,
  hintMessage,
  visitorId,
  ip,
  c
) => {
  await logToGoogleSheet(
    visitorId,
    `Failed: ${errorType}`,
    ip,
    new Date().toISOString(),
  );

  let currentFails = failedAttempts.get(visitorId) || 0;
  currentFails += 1;
  failedAttempts.set(visitorId, currentFails);

  if (currentFails >= 3) {
    await sendPushHint(visitorId, hintMessage);
    await logToGoogleSheet(
      visitorId,
      `Pushed Hint: ${errorType}`,
      ip,
      new Date().toISOString(),
    );
  }

  return c.json({ error: errorMsg }, statusCode);
};
