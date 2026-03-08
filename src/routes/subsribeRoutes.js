import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { userSubscriptions } from "../store/store.js";

const subscribeApp = new Hono();

subscribeApp.post("/", async (c) => {
  const visitorId = getCookie(c, "visitor_id");
  let subscription;
  try {
    subscription = await c.req.json();
  } catch (err) {
    return c.json({ error: "Invalid JSON body payload." }, 400);
  }

  if (visitorId && subscription) {
    userSubscriptions.set(visitorId, subscription);
    return c.json({ success: true, message: "Subscription saved." });
  }
  return c.json({ error: "Missing visitor ID or subscription." }, 400);
});

export default subscribeApp;