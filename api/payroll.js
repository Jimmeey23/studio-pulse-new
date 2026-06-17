// Serverless function to fetch Payroll data securely from Google Sheets
// Requires the following environment variables configured in Vercel or your environment:
// - GOOGLE_CLIENT_ID
// - GOOGLE_CLIENT_SECRET
// - GOOGLE_REFRESH_TOKEN
// - GOOGLE_SHEETS_SPREADSHEET_ID

// Load environment variables from .env file in development
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env file manually
try {
  const envFile = readFileSync(join(process.cwd(), '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    if (line && line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (e) {
  console.log('No .env file found or error reading it:', e.message);
}

async function getAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || '';
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed: ${resp.status} ${resp.statusText} - ${text}`);
  }

  const data = await resp.json();
  if (!data.access_token) throw new Error('No access_token returned from Google');
  return data.access_token;
}

function parseNumericValue(value) {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  const cleaned = value.toString().replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function mapRowToPayroll(row) {
  // Keep indexes aligned with the sheet mapping used previously in the client
  const teacherId = row[0] || '';
  const teacherName = row[1] || '';
  const teacherEmail = row[2] || '';
  const location = row[3] || '';

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

  const monthYear = row[24] || '';
  const unique = row[25] || '';
  const converted = parseNumericValue(row[26]);
  const conversionRate = parseNumericValue(row[27]);
  const retained = parseNumericValue(row[28]);
  const retentionRate = parseNumericValue(row[29]);
  const newMembers = parseNumericValue(row[30]);

  // Correct class averages
  const classAverageInclEmpty = totalSessions > 0 ? totalCustomers / totalSessions : 0;
  const classAverageExclEmpty = totalNonEmptySessions > 0 ? totalCustomers / totalNonEmptySessions : 0;

  return {
    teacherId,
    teacherName,
    teacherEmail,
    location,

    cycleSessions,
    emptyCycleSessions,
    nonEmptyCycleSessions,
    cycleCustomers,
    cyclePaid,

    strengthSessions,
    emptyStrengthSessions,
    nonEmptyStrengthSessions,
    strengthCustomers,
    strengthPaid,

    barreSessions,
    emptyBarreSessions,
    nonEmptyBarreSessions,
    barreCustomers,
    barrePaid,

    totalSessions,
    totalEmptySessions,
    totalNonEmptySessions,
    totalCustomers,
    totalPaid,

    
    monthYear,
    unique,
    converted,
    conversion: `${conversionRate}%`,
    retained,
    retention: `${retentionRate}%`,
    new: newMembers,
    conversionRate,
    retentionRate,
    classAverageInclEmpty,
    classAverageExclEmpty,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN || !spreadsheetId) {
    res.status(500).json({ error: 'Missing required Google API environment variables' });
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

    const result = await resp.json();
    const rows = Array.isArray(result.values) ? result.values : [];

    if (rows.length < 2) {
      res.status(200).json({ data: [] });
      return;
    }

    const data = rows.slice(1).map(mapRowToPayroll);
    res.status(200).json({ data, count: data.length });
  } catch (err) {
    console.error('Error in /api/payroll:', err);
    res.status(500).json({ error: 'Failed to load payroll data' });
  }
}
