import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || process.env.VITE_GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    res.status(503).json({ error: "Google OAuth credentials not configured on server." });
    return;
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const data = await response.json() as { access_token?: string; expires_in?: number; error_description?: string };
    if (!response.ok) { res.status(response.status).json({ error: data.error_description || "Token exchange failed" }); return; }
    res.json({ access_token: data.access_token, expires_in: data.expires_in || 3600 });
  } catch (err) {
    req.log.error({ err }, "Google token proxy error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
