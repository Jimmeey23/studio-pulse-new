import { Router } from "express";

const router = Router();

router.post("/", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Gemini API key not configured on server." });
    return;
  }
  try {
    const { model, body: requestBody } = req.body || {};
    const modelId = model || "gemini-1.5-flash-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json();
    if (!response.ok) { res.status(response.status).json(data); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Gemini proxy error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
