// Server-side Google OAuth token proxy — keeps client_secret off the browser
// GET /api/google/token — returns a short-lived access token

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return res.status(503).json({ error: 'Google OAuth credentials not configured on server.' });
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error_description || 'Token exchange failed' });
    }

    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in || 3600,
    });
  } catch (err) {
    console.error('Google token proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
