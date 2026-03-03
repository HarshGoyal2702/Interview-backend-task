const express = require('express');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const app = express();

app.use(cookieParser());
app.use(express.json()); // Essential for the JSON body payload check

// Basic Security: Limit each IP to 20 requests per 15 minutes to prevent brute forcing
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "The ancestors are weary of your spam. Too many attempts. The gate is locked for 15 minutes." }
});

// -------------------------------------------------------------------
// PHASE 1: THE CIPHER (GET Request)
// -------------------------------------------------------------------
app.get('/v1/interview/start', apiLimiter, (req, res) => {
  // Base64 Encoded Message: 
  // "The gates of Zenithra are sealed. Only a trusted seeker may enter. To forge the Master Key, solve the riddle of the ancients: I am a 4-digit cipher. My first digit is one-third of my second. My third unites the first two in sum. My final digit is three times my second. Speak this cipher as your auth_token."
//   const cipher = "VGhlIGdhdGVzIG9mIFplbml0aHJhIGFyZSBzZWFsZWQuIE9ubHkgYSB0cnVzdGVkIHNlZWtlciBtYXkgZW50ZXIuIFRvIGZvcmdlIHRoZSBNYXN0ZXIgS2V5LCBzb2x2ZSB0aGUgcmlkZGxlIG9mIHRoZSBhbmNpZW50czogSSBhbSBhIDQtZGlnaXQgY2lwaGVyLiBNeSBmaXJzdCBkaWdpdCBpcyBvbmUtdGhpcmQgb2YgbXkgc2Vjb25kLiBNeSB0aGlyZCB1bml0ZXMgdGhlIGZpcnN0IHR3byBpbiBzdW0uIE15IGZpbmFsIGRpZ2l0IGlzIHRocmVlIHRpbWVzIG15IHNlY29uZC4gU3BlYWsgdGhpcyBjaXBoZXIgYXMgeW91ciBhdXRoX3Rva2VuLg==";
  
    // "The gates of Zenithra are sealed. Only a trusted seeker may enter. To forge the Master Key, solve the riddle of the ancients: I am a 4-digit cipher. My first digit is one-third of my second. My third unites the first two in sum. My final digit is three times my second. Speak this cipher as your auth_token. The Guardian will ask who requested your presence. Tell them it was the 'Intern'."
  const cipher = "VGhlIGdhdGVzIG9mIFplbml0aHJhIGFyZSBzZWFsZWQuIE9ubHkgYSB0cnVzdGVkIHNlZWtlciBtYXkgZW50ZXIuIFRvIGZvcmdlIHRoZSBNYXN0ZXIgS2V5LCBzb2x2ZSB0aGUgcmlkZGxlIG9mIHRoZSBhbmNpZW50czogSSBhbSBhIDQtZGlnaXQgY2lwaGVyLiBNeSBmaXJzdCBkaWdpdCBpcyBvbmUtdGhpcmQgb2YgbXkgc2Vjb25kLiBNeSB0aGlyZCB1bml0ZXMgdGhlIGZpcnN0IHR3byBpbiBzdW0uIE15IGZpbmFsIGRpZ2l0IGlzIHRocmVlIHRpbWVzIG15IHNlY29uZC4gU3BlYWsgdGhpcyBjaXBoZXIgYXMgeW91ciBhdXRoX3Rva2VuLiBUaGUgR3VhcmRpYW4gd2lsbCBhc2sgd2hvIHJlcXVlc3RlZCB5b3VyIHByZXNlbmNlLiBUZWxsIHRoZW0gaXQgd2FzIHRoZSAnSW50ZXJuJy4=";
res.status(200).json({
    guardian_message: "Halt, traveler. You have found the hidden path, but the door is barred.",
    directive: "Decode the ancient scroll (payload) to find your auth_token. Then, POST to /v1/interview/vault. Warning: The vault only accepts the JSON dialect, requires a temporal anchor ('timestamp' in Unix seconds), and immediately rejects soulless machines (default API clients).",
    payload: cipher
  });

});

// -------------------------------------------------------------------
// PHASE 2: THE VAULT (POST Request)
// -------------------------------------------------------------------
app.post('/v1/interview/vault', apiLimiter, (req, res) => {
  const origin = req.headers.origin;
  const requestedBy = req.headers['x-requested-by'];
  const userAgent = req.headers['user-agent'] || '';
  const authToken = req.cookies.auth_token; 
  const payloadTimestamp = req.body.timestamp; // Checking the JSON body

  // 1. Content-Type Check (Ensures they are sending JSON correctly)
  if (req.headers['content-type'] !== 'application/json') {
    return res.status(415).json({ error: "The ancient vault only reads the language of JSON. Your dialect is unrecognized." });
  }

  // 2. Anti-Tool Check
  if (userAgent.includes('PostmanRuntime') || userAgent.includes('axios') || userAgent.includes('curl')) {
    return res.status(403).json({ error: "The guardian recognizes the mechanical hum of automated tools. Disguise your ${'User-Agent'}, shape-shifter." });
  }

  // 3. CORS & Custom Header Check
  if (origin !== 'https://zenithratech.com') {
    return res.status(403).json({ error: "You approach from a foreign land. Only those originating from the Zenithra realm may pass." });
  }

  if (requestedBy !== 'Intern') {
    return res.status(401).json({ error: "Halt! The proud are turned away. Only the humblest of our ranks may grant you passage. Who requested your presence? (Check your headers)" });
  } 
  // 4. The Reasoning Puzzle Token Check (Cookie)
  if (!authToken) {
    return res.status(401).json({ error: "You approach the gate empty-handed. Where is the Master Key (auth_token cookie)?" });
  }

  if (authToken !== '1349') {
    return res.status(401).json({ error: "The gate groans, but remains shut. Your deductive reasoning is flawed. The ancestors weep at your incorrect key." });
  }

  // 5. Dynamic Time-based Payload Check (Prevents Replay Attacks)
  if (!payloadTimestamp || typeof payloadTimestamp !== 'number') {
    return res.status(400).json({ error: "You are lost in time. The vault requires a temporal anchor ('timestamp' in your JSON payload)." });
  }

  const currentEpochSeconds = Math.floor(Date.now() / 1000);
  const timeDifference = currentEpochSeconds - payloadTimestamp;

  if (timeDifference < 0 || timeDifference > 120) {
    return res.status(401).json({ error: `Temporal rift collapsed. Your timestamp is out of sync by ${timeDifference} seconds. You must be swifter (within 120 seconds).` });
  }

  // If they pass ALL checks, grant access!

  res.status(200).json({
    success: true,
    message: "The ancient gates grind open. You have proven your worth as a Master of the Full-Stack arts. Claim your relic.",
    vault_url: "https://github.com/HarshGoyal2702/Final-Interview-Task",
    vault_password: "backend_master_2026"
  });
});

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`The Zenithra Gatekeeper is actively guarding port ${PORT}...`);
// });


const serverless = require('serverless-http');
module.exports.handler = serverless(app);