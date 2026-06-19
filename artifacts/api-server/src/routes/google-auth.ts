import { Router } from "express";

const router = Router();

// Short-lived in-memory store for OAuth state (keyed by random nonce)
const oauthState = new Map<string, { clientId: string; clientSecret: string; expires: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of oauthState.entries()) {
    if (val.expires < now) oauthState.delete(key);
  }
}, 10 * 60 * 1000);

const getDomain = (req: any): string =>
  process.env.REPLIT_DEV_DOMAIN || (req.get("host") as string);

// Step 1 — redirect browser to Google consent screen
router.get("/", (req, res) => {
  const clientId = req.query.client_id as string;
  const clientSecret = req.query.client_secret as string;

  if (!clientId || !clientSecret) {
    res.status(400).json({ error: "client_id and client_secret are required" });
    return;
  }

  const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
  oauthState.set(nonce, {
    clientId,
    clientSecret,
    expires: Date.now() + 10 * 60 * 1000,
  });

  const domain = getDomain(req);
  const redirectUri = `https://${domain}/api/auth/google/callback`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/spreadsheets.readonly");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", nonce);

  res.redirect(authUrl.toString());
});

// Step 2 — Google redirects back here with the auth code
router.get("/callback", async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>;
  const domain = getDomain(req);
  const frontendBase = `https://${domain}/`;

  if (error) {
    res.redirect(`${frontendBase}?google_setup=error&message=${encodeURIComponent(error)}`);
    return;
  }

  const stored = oauthState.get(state);
  if (!stored || stored.expires < Date.now()) {
    res.redirect(
      `${frontendBase}?google_setup=error&message=${encodeURIComponent("Session expired — please start the setup again.")}`
    );
    return;
  }

  oauthState.delete(state);
  const { clientId, clientSecret } = stored;
  const redirectUri = `https://${domain}/api/auth/google/callback`;

  try {
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const data = (await response.json()) as {
      refresh_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!response.ok || !data.refresh_token) {
      const msg = data.error_description || data.error || "Token exchange failed — make sure you added the redirect URI to your OAuth client.";
      res.redirect(`${frontendBase}?google_setup=error&message=${encodeURIComponent(msg)}`);
      return;
    }

    // Send all 3 values back so the frontend can show them together
    res.redirect(
      `${frontendBase}?google_setup=done` +
        `&refresh_token=${encodeURIComponent(data.refresh_token)}` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&client_secret=${encodeURIComponent(clientSecret)}`
    );
  } catch (err) {
    req.log.error({ err }, "OAuth callback error");
    res.redirect(
      `${frontendBase}?google_setup=error&message=${encodeURIComponent("Internal error during token exchange.")}`
    );
  }
});

export default router;
