import { Router } from "express";

const router = Router();

const GOOGLE_CONFIG = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN || "",
  TOKEN_URL: process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token",
};

const SHEET_ID = process.env.NOTES_SHEET_ID || "1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0";
const NOTES_SHEET_NAME = process.env.NOTES_SHEET_NAME || "Notes";

async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    client_id: GOOGLE_CONFIG.CLIENT_ID,
    client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
    refresh_token: GOOGLE_CONFIG.REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const resp = await fetch(GOOGLE_CONFIG.TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!resp.ok) throw new Error(`Failed to obtain access token: ${await resp.text()}`);
  const json = await resp.json() as { access_token: string };
  return json.access_token;
}

async function ensureHeaderAndSheet(accessToken: string) {
  const headersResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(NOTES_SHEET_NAME)}!A1:I1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (headersResp.ok) return;
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: NOTES_SHEET_NAME } } }] }),
  });
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(NOTES_SHEET_NAME)}!A1:I1?valueInputOption=RAW`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ values: [["timestamp", "tableKey", "location", "period", "sectionId", "author", "note", "summary", "version"]] }),
  });
}

async function getSheetId(accessToken: string): Promise<number> {
  const metaResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets(properties(sheetId%2Ctitle))`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!metaResp.ok) throw new Error(await metaResp.text());
  const meta = await metaResp.json() as { sheets: Array<{ properties: { sheetId: number; title: string } }> };
  const sheet = (meta.sheets || []).map((s) => s.properties).find((p) => p.title === NOTES_SHEET_NAME);
  if (!sheet) throw new Error(`Sheet '${NOTES_SHEET_NAME}' not found`);
  return sheet.sheetId;
}

router.get("/", async (req, res) => {
  try {
    const { tableKey, location, period, sectionId } = req.query as Record<string, string>;
    const accessToken = await getAccessToken();
    await ensureHeaderAndSheet(accessToken);
    const range = `${NOTES_SHEET_NAME}!A2:I10000`;
    const getResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!getResp.ok) throw new Error(await getResp.text());
    const json = await getResp.json() as { values?: string[][] };
    const rows = json.values || [];
    const items = rows
      .map((r, idx) => ({
        rowNumber: idx + 2,
        timestamp: r[0], tableKey: r[1], location: r[2], period: r[3],
        sectionId: r[4], author: r[5], note: r[6], summary: r[7], version: r[8],
      }))
      .filter((x) => (!tableKey || x.tableKey === tableKey) && (!location || x.location === location) && (!period || x.period === period) && (!sectionId || x.sectionId === sectionId));
    res.json({ notes: items });
  } catch (readError) {
    req.log.warn({ err: readError }, "Notes API read unavailable, returning empty notes");
    res.json({ notes: [], unavailable: true });
  }
});

router.post("/", async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    await ensureHeaderAndSheet(accessToken);
    const { tableKey, location, period, sectionId, author, note, summary, row } = req.body || {};
    if (!tableKey) { res.status(400).json({ error: "tableKey required" }); return; }
    const nowISO = new Date().toISOString();
    if (row && typeof row === "number") {
      const values = [[nowISO, tableKey || "", location || "", period || "", sectionId || "", author || "", note || "", summary || "", "v1"]];
      const range = `${NOTES_SHEET_NAME}!A${row}:I${row}`;
      const putResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ values }),
      });
      if (!putResp.ok) throw new Error(await putResp.text());
      res.json({ ok: true, updated: true });
    } else {
      const values = [[nowISO, tableKey || "", location || "", period || "", sectionId || "", author || "", note || "", summary || "", "v1"]];
      const appendResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(NOTES_SHEET_NAME)}!A:I:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ values }),
      });
      if (!appendResp.ok) throw new Error(await appendResp.text());
      res.json({ ok: true, appended: true });
    }
  } catch (err) {
    req.log.error({ err }, "Notes POST error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    await ensureHeaderAndSheet(accessToken);
    const rowParam = req.query.row || req.query.rowNumber || req.body?.row || req.body?.rowNumber;
    const row = Number(rowParam);
    if (!row || Number.isNaN(row) || row <= 1) { res.status(400).json({ error: "Valid row number (>1) required" }); return; }
    const sheetId = await getSheetId(accessToken);
    const batchResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: row - 1, endIndex: row } } }],
      }),
    });
    if (!batchResp.ok) throw new Error(await batchResp.text());
    res.json({ ok: true, deleted: true, row });
  } catch (err) {
    req.log.error({ err }, "Notes DELETE error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
