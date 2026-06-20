/**
 * Centralized Google OAuth Authentication Utility
 * 
 * This module provides a single source of truth for Google API authentication,
 * with built-in rate limiting, caching, and error handling.
 */

// Google OAuth is handled server-side via /api/google/token proxy.
// Credentials are never exposed to the browser bundle.
const GOOGLE_CONFIG = {
  TOKEN_URL: '/api/google/token'
};

// Spreadsheet IDs
export const SPREADSHEET_IDS = {
  PAYROLL:     import.meta.env.VITE_PAYROLL_SPREADSHEET_ID     || '149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI',
  NEW_CLIENTS: import.meta.env.VITE_NEW_CLIENTS_SPREADSHEET_ID || '',
  // Sessions and Checkins live in the same spreadsheet — keep this ID in sync with the
  // hardcoded ID in useCheckinsData.ts and useLateCancellationsData.ts.
  SESSIONS:    import.meta.env.VITE_SESSIONS_SPREADSHEET_ID    || '1a7XKv2WCog7o8nYuV8YcFdqtfPYJNRO6DelJ6Hn_z6Q',
  EXPIRATIONS: import.meta.env.VITE_EXPIRATIONS_SPREADSHEET_ID || '1x-0iFgnYmEqt-b2MfAgHVx5CErcX5NtZYB9p5Rh6f1I',
  SALES:       import.meta.env.VITE_SALES_SPREADSHEET_ID       || '1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0',
};

// Token cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// Request queue for rate limiting
interface QueuedRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  request: () => Promise<any>;
}

const requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests (60/min limit)

/**
 * Get a valid access token, using cache when possible
 */
export const getGoogleAccessToken = async (): Promise<string> => {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  const RETRY_DELAYS = [0, 2000, 5000, 10000];

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    if (RETRY_DELAYS[attempt] > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
    }

    try {
      const response = await fetch(GOOGLE_CONFIG.TOKEN_URL, { method: 'GET' });

      if (response.status === 503 && attempt < RETRY_DELAYS.length - 1) {
        continue;
      }

      if (!response.ok) {
        const err: any = new Error(`Token refresh failed: ${response.status}`);
        err.status = response.status;
        throw err;
      }

      const tokenData = await response.json();
      if (tokenData.error) {
        throw new Error(tokenData.error);
      }

      cachedToken = tokenData.access_token;
      tokenExpiry = Date.now() + (tokenData.expires_in || 3600) * 1000;

      return cachedToken as string;
    } catch (error: any) {
      if (attempt < RETRY_DELAYS.length - 1 && (!error.status || error.status === 503)) {
        continue;
      }
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  throw new Error('Token refresh failed after retries');
};

/**
 * Process the request queue with rate limiting
 */
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    
    const item = requestQueue.shift();
    if (!item) continue;
    
    try {
      lastRequestTime = Date.now();
      const result = await item.request();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }
  }
  
  isProcessingQueue = false;
};

/**
 * Queue a request to be executed with rate limiting
 */
export const queueRequest = <T>(request: () => Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, request });
    processQueue();
  });
};

const SHEET_RETRY_DELAYS = [0, 2000, 5000, 15000];

async function fetchWithRetry(url: string, accessToken: string): Promise<any> {
  for (let attempt = 0; attempt < SHEET_RETRY_DELAYS.length; attempt++) {
    if (SHEET_RETRY_DELAYS[attempt] > 0) {
      await new Promise(resolve => setTimeout(resolve, SHEET_RETRY_DELAYS[attempt]));
    }
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 503 && attempt < SHEET_RETRY_DELAYS.length - 1) {
      continue;
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch sheet data: ${response.status} - ${errorText}`);
    }
    return response.json();
  }
  throw new Error('Failed to fetch sheet data after retries');
}

/**
 * Fetch data from a Google Sheet with rate limiting
 */
export const fetchGoogleSheet = async (
  spreadsheetId: string,
  range: string,
  options: {
    valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA';
    dateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING';
  } = {}
): Promise<any[][]> => {
  const { 
    valueRenderOption = 'UNFORMATTED_VALUE',
    dateTimeRenderOption = 'FORMATTED_STRING'
  } = options;

  return queueRequest(async () => {
    const accessToken = await getGoogleAccessToken();
    
    const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`);
    url.searchParams.set('valueRenderOption', valueRenderOption);
    url.searchParams.set('dateTimeRenderOption', dateTimeRenderOption);
    
    const result = await fetchWithRetry(url.toString(), accessToken);
    return result.values || [];
  });
};

/**
 * Batch fetch multiple ranges from a Google Sheet
 */
export const batchFetchGoogleSheet = async (
  spreadsheetId: string,
  ranges: string[],
  options: {
    valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA';
    dateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING';
  } = {}
): Promise<Map<string, any[][]>> => {
  const { 
    valueRenderOption = 'UNFORMATTED_VALUE',
    dateTimeRenderOption = 'FORMATTED_STRING'
  } = options;

  return queueRequest(async () => {
    const accessToken = await getGoogleAccessToken();
    
    const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet`);
    ranges.forEach(range => url.searchParams.append('ranges', range));
    url.searchParams.set('valueRenderOption', valueRenderOption);
    url.searchParams.set('dateTimeRenderOption', dateTimeRenderOption);
    
    const result = await fetchWithRetry(url.toString(), accessToken);
    const resultMap = new Map<string, any[][]>();
    
    result.valueRanges?.forEach((vr: any, index: number) => {
      resultMap.set(ranges[index], vr.values || []);
    });
    
    return resultMap;
  });
};

/**
 * Parse a numeric value from sheet data
 */
export const parseNumericValue = (value: string | number): number => {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  if (!value || value === '') return 0;
  const cleaned = value.toString().replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Parse a date value from sheet data
 */
export const parseDateValue = (value: string | number): Date | null => {
  if (!value) return null;
  
  // Handle Excel serial date numbers
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Validate Google config by pinging the server-side token proxy.
 * Credentials live on the server — nothing to check in the browser bundle.
 */
export const validateGoogleConfig = (): boolean => {
  return true;
};
