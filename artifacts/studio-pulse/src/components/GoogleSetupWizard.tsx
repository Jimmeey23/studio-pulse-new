import { useState, useEffect, useCallback } from "react";

interface Secrets {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

const CopyBox = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-gray-100 border border-gray-200 rounded px-3 py-2 text-xs font-mono break-all text-gray-800 select-all">
          {value}
        </code>
        <button
          onClick={copy}
          className="shrink-0 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-colors"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
};

export const GoogleSetupWizard = () => {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"form" | "done" | "error">("form");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [secrets, setSecrets] = useState<Secrets | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setup = params.get("google_setup");

    if (setup === "done") {
      const rt = params.get("refresh_token") || "";
      const ci = params.get("client_id") || "";
      const cs = params.get("client_secret") || "";
      setSecrets({ refreshToken: rt, clientId: ci, clientSecret: cs });
      setStep("done");
      setShow(true);
      window.history.replaceState({}, "", window.location.pathname);
      setChecking(false);
      return;
    }

    if (setup === "error") {
      const msg = params.get("message") || "Unknown error";
      setErrorMsg(msg);
      setStep("error");
      setShow(true);
      window.history.replaceState({}, "", window.location.pathname);
      setChecking(false);
      return;
    }

    // Check if credentials are already configured
    fetch("/api/google/token")
      .then((r) => {
        if (r.status === 503) {
          return r.json().then((d) => {
            if (d?.error?.includes("not configured")) {
              setShow(true);
            }
          });
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const startOAuth = useCallback(() => {
    if (!clientId.trim() || !clientSecret.trim()) return;
    const url =
      `/api/auth/google?` +
      `client_id=${encodeURIComponent(clientId.trim())}` +
      `&client_secret=${encodeURIComponent(clientSecret.trim())}`;
    window.location.href = url;
  }, [clientId, clientSecret]);

  if (checking || !show) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-indigo-600 rounded-t-2xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
              🔑
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Connect Google Sheets</h2>
              <p className="text-indigo-200 text-sm">One-time setup to load your studio data</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* ── FORM STEP ── */}
          {step === "form" && (
            <>
              <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
                <p className="font-semibold">Before you start, you'll need a Google OAuth 2.0 client:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>
                    Go to{" "}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium"
                    >
                      Google Cloud Console → Credentials
                    </a>
                  </li>
                  <li>Create (or open) an <strong>OAuth 2.0 Client ID</strong> of type <strong>Web application</strong></li>
                  <li>
                    Under <strong>Authorized redirect URIs</strong>, add exactly:
                    <br />
                    <code className="bg-blue-100 px-1 rounded text-xs break-all">
                      https://{window.location.host}/api/auth/google/callback
                    </code>
                  </li>
                  <li>Enable the <strong>Google Sheets API</strong> in your project</li>
                </ol>
              </div>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="xxxxxxxxx.apps.googleusercontent.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="GOCSPX-..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={startOAuth}
                disabled={!clientId.trim() || !clientSecret.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 1 1 0-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0 0 12.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                </svg>
                Authorize with Google
              </button>
            </>
          )}

          {/* ── DONE STEP ── */}
          {step === "done" && secrets && (
            <>
              <div className="mb-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <span className="text-xl">✅</span>
                <p className="text-sm font-medium">
                  Authorization successful! Copy each value below and add it to Replit Secrets.
                </p>
              </div>

              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <p className="font-semibold mb-1">How to add secrets in Replit:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-amber-700">
                  <li>Click the <strong>🔒 Secrets</strong> icon in the left sidebar</li>
                  <li>Add each key + value below, then click <strong>Add Secret</strong></li>
                  <li>The API server will restart automatically and data will load</li>
                </ol>
              </div>

              <CopyBox label="GOOGLE_CLIENT_ID" value={secrets.clientId} />
              <CopyBox label="GOOGLE_CLIENT_SECRET" value={secrets.clientSecret} />
              <CopyBox label="GOOGLE_REFRESH_TOKEN" value={secrets.refreshToken} />

              <button
                onClick={() => window.location.reload()}
                className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Reload Dashboard
              </button>
            </>
          )}

          {/* ── ERROR STEP ── */}
          {step === "error" && (
            <>
              <div className="mb-4 flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span className="text-xl mt-0.5">❌</span>
                <div>
                  <p className="font-semibold text-sm">Authorization failed</p>
                  <p className="text-sm mt-1">{errorMsg}</p>
                </div>
              </div>
              <button
                onClick={() => setStep("form")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
