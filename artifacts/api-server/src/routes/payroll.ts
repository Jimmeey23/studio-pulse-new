import { Router } from "express";

const router = Router();

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET || "";
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || process.env.VITE_GOOGLE_REFRESH_TOKEN || "";
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed: ${resp.status} ${resp.statusText} - ${text}`);
  }
  const data = await resp.json() as { access_token?: string };
  if (!data.access_token) throw new Error("No access_token returned from Google");
  return data.access_token;
}

function parseNumericValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value || value === "") return 0;
  const cleaned = String(value).replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function mapRowToPayroll(row: string[]) {
  const teacherId = row[0] || "";
  const teacherName = row[1] || "";
  const teacherEmail = row[2] || "";
  const location = row[3] || "";
  const cycleSessions = parseNumericValue(row[4]);
  const emptyCycleSessions = parseNumericValue(row[5]);
  const nonEmptyCycleSessions = parseNumericValue(row[6]);
  const cycleCustomers = parseNumericValue(row[7]);
  const cyclePaid = parseNumericValue(row[8]);
  const strengthSessions = parseNumericValue(row[9]);
  const emptyStrengthSessions = parseNumericValue(row[10]);
  const nonEmptyStrengthSessions = parseNumericValue(row[11]);
  const strengthCustomers = parseNumericValue(row[12]);
  const strengthPaid = parseNumericValue(row[13]);
  const barreSessions = parseNumericValue(row[14]);
  const emptyBarreSessions = parseNumericValue(row[15]);
  const nonEmptyBarreSessions = parseNumericValue(row[16]);
  const barreCustomers = parseNumericValue(row[17]);
  const barrePaid = parseNumericValue(row[18]);
  const totalSessions = parseNumericValue(row[19]);
  const totalEmptySessions = parseNumericValue(row[20]);
  const totalNonEmptySessions = parseNumericValue(row[21]);
  const totalCustomers = parseNumericValue(row[22]);
  const totalPaid = parseNumericValue(row[23]);
  const monthYear = row[24] || "";
  const unique = row[25] || "";
  const converted = parseNumericValue(row[26]);
  const conversionRate = parseNumericValue(row[27]);
  const retained = parseNumericValue(row[28]);
  const retentionRate = parseNumericValue(row[29]);
  const newMembers = parseNumericValue(row[30]);
  const classAverageInclEmpty = totalSessions > 0 ? totalCustomers / totalSessions : 0;
  const classAverageExclEmpty = totalNonEmptySessions > 0 ? totalCustomers / totalNonEmptySessions : 0;
  return {
    teacherId, teacherName, teacherEmail, location,
    cycleSessions, emptyCycleSessions, nonEmptyCycleSessions, cycleCustomers, cyclePaid,
    strengthSessions, emptyStrengthSessions, nonEmptyStrengthSessions, strengthCustomers, strengthPaid,
    barreSessions, emptyBarreSessions, nonEmptyBarreSessions, barreCustomers, barrePaid,
    totalSessions, totalEmptySessions, totalNonEmptySessions, totalCustomers, totalPaid,
    monthYear, unique, converted,
    conversion: `${conversionRate}%`, retained, retention: `${retentionRate}%`,
    new: newMembers, conversionRate, retentionRate, classAverageInclEmpty, classAverageExclEmpty,
  };
}

router.get("/", async (req, res) => {
  const spreadsheetId =
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
    process.env.VITE_PAYROLL_SPREADSHEET_ID ||
    "149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI";

  if (
    !(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID) ||
    !(process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET) ||
    !(process.env.GOOGLE_REFRESH_TOKEN || process.env.VITE_GOOGLE_REFRESH_TOKEN)
  ) {
    res.status(500).json({ error: "Missing required Google API environment variables" });
    return;
  }

  try {
    const accessToken = await getAccessToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Payroll?alt=json`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Sheets fetch failed: ${resp.status} ${resp.statusText} - ${text}`);
    }
    const result = await resp.json() as { values?: string[][] };
    const rows = Array.isArray(result.values) ? result.values : [];
    if (rows.length < 2) { res.json({ data: [] }); return; }
    const data = rows.slice(1).map(mapRowToPayroll);
    res.json({ data, count: data.length });
  } catch (err) {
    req.log.error({ err }, "Error in /api/payroll");
    res.status(500).json({ error: "Failed to load payroll data" });
  }
});

export default router;
