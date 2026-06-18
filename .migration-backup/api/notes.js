// Serverless API to persist AI notes and summaries in Google Sheets using OAuth refresh token
// Method: GET (load notes), POST (save note)
// Body: { tableKey, location, period, sectionId, author, note(HTML), summary(HTML) }
// Returns: { ok: true } or { notes: [...] }

const GOOGLE_CONFIG = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN || "",
  TOKEN_URL: process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token"
};

const SHEET_ID = process.env.NOTES_SHEET_ID || "1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0";
const NOTES_SHEET_NAME = process.env.NOTES_SHEET_NAME || 'Notes';

async function getAccessToken() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CONFIG.CLIENT_ID,
    client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
    refresh_token: GOOGLE_CONFIG.REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  const resp = await fetch(GOOGLE_CONFIG.TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  if (!resp.ok) {
    throw new Error(`Failed to obtain access token: ${await resp.text()}`);
  }
  const json = await resp.json();
  return json.access_token;
}

async function ensureHeaderAndSheet(accessToken) {
  // Try to fetch header; if sheet not found, attempt to create it
  const headersResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(NOTES_SHEET_NAME)}!A1:I1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (headersResp.ok) return; // exists

  // Add sheet via batchUpdate
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      requests: [
        { addSheet: { properties: { title: NOTES_SHEET_NAME } } }
      ]
    })
  });

  // Write header row
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(NOTES_SHEET_NAME)}!A1:I1?valueInputOption=RAW`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ values: [[
      'timestamp', 'tableKey', 'location', 'period', 'sectionId', 'author', 'note', 'summary', 'version'
    ]]})
  });
}

function nowISO() { return new Date().toISOString(); }

function serializeError(err) {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function getSheetId(accessToken) {
  // Fetch spreadsheet metadata to find sheetId for NOTES_SHEET_NAME
  const metaResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets(properties(sheetId%2Ctitle))`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!metaResp.ok) throw new Error(await metaResp.text());
  const meta = await metaResp.json();
  const sheet = (meta.sheets || []).map(s => s.properties).find(p => p.title === NOTES_SHEET_NAME);
  if (!sheet) throw new Error(`Sheet '${NOTES_SHEET_NAME}' not found`);
  return sheet.sheetId;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { tableKey, location, period, sectionId } = req.query;
      try {
        const accessToken = await getAccessToken();
        await ensureHeaderAndSheet(accessToken);

        const range = `${NOTES_SHEET_NAME}!A2:I10000`;
        const getResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!getResp.ok) throw new Error(await getResp.text());
        const json = await getResp.json();
        const rows = json.values || [];
        const items = rows.map((r, idx) => ({
          // A2 corresponds to sheet row 2 (1-based). So rowNumber is idx + 2
          rowNumber: idx + 2,
          timestamp: r[0], tableKey: r[1], location: r[2], period: r[3], sectionId: r[4], author: r[5], note: r[6], summary: r[7], version: r[8]
        })).filter(x => (!tableKey || x.tableKey === tableKey) && (!location || x.location === location) && (!period || x.period === period) && (!sectionId || x.sectionId === sectionId));
        return res.status(200).json({ notes: items });
      } catch (readError) {
        console.warn('Notes API read unavailable, returning empty notes:', serializeError(readError));
        return res.status(200).json({ notes: [], unavailable: true });
      }
    }

    const accessToken = await getAccessToken();
    await ensureHeaderAndSheet(accessToken);

    if (req.method === 'POST') {
      const { tableKey, location, period, sectionId, author, note, summary, row } = req.body || {};
      if (!tableKey) return res.status(400).json({ error: 'tableKey required' });

      // If row provided, update specific range, else append
      if (row && typeof row === 'number') {
        const values = [[nowISO(), tableKey || '', location || '', period || '', sectionId || '', author || '', note || '', summary || '', 'v1']];
        const range = `${NOTES_SHEET_NAME}!A${row}:I${row}`;
        const putResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ values })
        });
        if (!putResp.ok) throw new Error(await putResp.text());
        return res.status(200).json({ ok: true, updated: true });
      } else {
        const values = [[nowISO(), tableKey || '', location || '', period || '', sectionId || '', author || '', note || '', summary || '', 'v1']];
        const appendResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(NOTES_SHEET_NAME)}!A:I:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ values })
        });
        if (!appendResp.ok) throw new Error(await appendResp.text());
        return res.status(200).json({ ok: true, appended: true });
      }
    }

    if (req.method === 'DELETE') {
      // Delete a specific row (1-based). Accept from query or body. Prevent deleting header row.
      const rowParam = (req.query && (req.query.row || req.query.rowNumber)) ?? (req.body && (req.body.row || req.body.rowNumber));
      const row = Number(rowParam);
      if (!row || Number.isNaN(row) || row <= 1) {
        return res.status(400).json({ error: 'Valid row number (>1) required' });
      }
      const sheetId = await getSheetId(accessToken);
      const batchResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: row - 1, // inclusive (0-based). Row 1 is header, row 2 -> index 1
                  endIndex: row // exclusive
                }
              }
            }
          ]
        })
      });
      if (!batchResp.ok) throw new Error(await batchResp.text());
      return res.status(200).json({ ok: true, deleted: true, row });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Notes API error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
