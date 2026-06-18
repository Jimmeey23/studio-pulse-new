import { Router } from "express";

const router = Router();

router.post("/", async (req, res) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "DeepSeek API key not configured on server." });
    return;
  }
  try {
    const body = req.body || {};
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) { res.status(response.status).json(data); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "DeepSeek proxy error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
