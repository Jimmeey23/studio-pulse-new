import { defineConfig, type ViteDevServer, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import notesHandler from "./api/notes.js";
import payrollHandler from "./api/payroll.js";
import openaiHandler from "./api/openai.js";
import geminiHandler from "./api/gemini.js";
import googleTokenHandler from "./api/google-token.js";
import deepseekHandler from "./api/deepseek.js";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },

  plugins: [
    react({
      jsxImportSource: "react",
    }),

    // Local API middleware for /api/notes
    mode === "development" && {
      name: "local-api-notes",
      configureServer(server: ViteDevServer) {
        server.middlewares.use("/api/notes", (req: any, res: any, next: any) => {
          if (!["GET", "POST", "DELETE"].includes(req.method)) return next();

          // Ensure environment variables are available to the notes API handler from loaded env
          process.env.GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
          process.env.GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || env.VITE_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
          process.env.GOOGLE_REFRESH_TOKEN = env.GOOGLE_REFRESH_TOKEN || env.VITE_GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
          process.env.GOOGLE_TOKEN_URL = env.GOOGLE_TOKEN_URL || env.VITE_GOOGLE_TOKEN_URL || process.env.GOOGLE_TOKEN_URL;
          process.env.NOTES_SHEET_ID = env.NOTES_SHEET_ID || env.VITE_NOTES_SHEET_ID || process.env.NOTES_SHEET_ID;
          process.env.NOTES_SHEET_NAME = env.NOTES_SHEET_NAME || env.VITE_NOTES_SHEET_NAME || process.env.NOTES_SHEET_NAME;

          try {
            const url = new URL(req.url || "", "http://localhost");
            (req as any).query = Object.fromEntries(url.searchParams.entries());
          } catch {
            (req as any).query = {};
          }

          const wrapResponse = (res: any) =>
            Object.assign(res, {
              status(code: number) {
                res.statusCode = code;
                return res;
              },
              json(obj: any) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(obj));
              },
            });

          if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk: any) => (body += chunk));
            req.on("end", async () => {
              try {
                (req as any).body = body ? JSON.parse(body) : {};
              } catch {
                (req as any).body = {};
              }
              Promise.resolve(notesHandler(req, wrapResponse(res))).catch((err: any) => {
                console.error("Local /api/notes error", err);
                wrapResponse(res).status(500).json({ error: "Internal server error" });
              });
            });
            return;
          }

          Promise.resolve(notesHandler(req, wrapResponse(res))).catch((err: any) => {
            console.error("Local /api/notes error", err);
            wrapResponse(res).status(500).json({ error: "Internal server error" });
          });
        });
      },
    },

    // Local API middleware for /api/payroll
    mode === "development" && {
      name: "local-api-payroll",
      configureServer(server: ViteDevServer) {
        server.middlewares.use("/api/payroll", (req: any, res: any, next: any) => {
          if (req.method !== "GET") return next();

          // Ensure environment variables are available to the API handler from loaded env
          const _gcid2 = env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
          const _gcs2  = env.GOOGLE_CLIENT_SECRET || env.VITE_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
          const _grt2  = env.GOOGLE_REFRESH_TOKEN || env.VITE_GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
          const _gssi  = env.GOOGLE_SHEETS_SPREADSHEET_ID || env.VITE_PAYROLL_SPREADSHEET_ID;
          if (_gcid2) process.env.GOOGLE_CLIENT_ID = _gcid2;
          if (_gcs2)  process.env.GOOGLE_CLIENT_SECRET = _gcs2;
          if (_grt2)  process.env.GOOGLE_REFRESH_TOKEN = _grt2;
          if (_gssi)  process.env.GOOGLE_SHEETS_SPREADSHEET_ID = _gssi;

          try {
            const url = new URL(req.url || "", "http://localhost");
            (req as any).query = Object.fromEntries(url.searchParams.entries());
          } catch {
            (req as any).query = {};
          }

          const wrapResponse = (res: any) =>
            Object.assign(res, {
              status(code: number) {
                res.statusCode = code;
                return res;
              },
              json(obj: any) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(obj));
              },
            });

          Promise.resolve(payrollHandler(req, wrapResponse(res))).catch((err: any) => {
            console.error("Local /api/payroll error", err);
            wrapResponse(res).status(500).json({ error: "Internal server error" });
          });
        });
      },
    },

    // Local API middleware for /api/openai
    mode === "development" && {
      name: "local-api-openai",
      configureServer(server: ViteDevServer) {
        server.middlewares.use("/api/openai", (req: any, res: any, next: any) => {
          if (req.method !== "POST") return next();

          process.env.OPENAI_API_KEY = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
          process.env.VITE_OPENAI_API_KEY = process.env.OPENAI_API_KEY;

          const wrapResponse = (res: any) =>
            Object.assign(res, {
              status(code: number) { res.statusCode = code; return res; },
              json(obj: any) { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); },
            });

          let body = "";
          req.on("data", (chunk: any) => (body += chunk));
          req.on("end", async () => {
            try { (req as any).body = body ? JSON.parse(body) : {}; } catch { (req as any).body = {}; }
            Promise.resolve(openaiHandler(req, wrapResponse(res))).catch((err: any) => {
              console.error("Local /api/openai error", err);
              wrapResponse(res).status(500).json({ error: "Internal server error" });
            });
          });
        });
      },
    },

    // Local API middleware for /api/gemini
    mode === "development" && {
      name: "local-api-gemini",
      configureServer(server: ViteDevServer) {
        server.middlewares.use("/api/gemini", (req: any, res: any, next: any) => {
          if (req.method !== "POST") return next();

          process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
          process.env.VITE_GEMINI_API_KEY = process.env.GEMINI_API_KEY;

          const wrapResponse = (res: any) =>
            Object.assign(res, {
              status(code: number) { res.statusCode = code; return res; },
              json(obj: any) { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); },
            });

          let body = "";
          req.on("data", (chunk: any) => (body += chunk));
          req.on("end", async () => {
            try { (req as any).body = body ? JSON.parse(body) : {}; } catch { (req as any).body = {}; }
            Promise.resolve(geminiHandler(req, wrapResponse(res))).catch((err: any) => {
              console.error("Local /api/gemini error", err);
              wrapResponse(res).status(500).json({ error: "Internal server error" });
            });
          });
        });
      },
    },

    // Local API middleware for /api/deepseek
    mode === "development" && {
      name: "local-api-deepseek",
      configureServer(server: ViteDevServer) {
        server.middlewares.use("/api/deepseek", (req: any, res: any, next: any) => {
          if (req.method !== "POST") return next();

          process.env.DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;

          const wrapResponse = (res: any) =>
            Object.assign(res, {
              status(code: number) { res.statusCode = code; return res; },
              json(obj: any) { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); },
            });

          let body = "";
          req.on("data", (chunk: any) => (body += chunk));
          req.on("end", async () => {
            try { (req as any).body = body ? JSON.parse(body) : {}; } catch { (req as any).body = {}; }
            Promise.resolve(deepseekHandler(req, wrapResponse(res))).catch((err: any) => {
              console.error("Local /api/deepseek error", err);
              wrapResponse(res).status(500).json({ error: "Internal server error" });
            });
          });
        });
      },
    },

    // Local API middleware for /api/google/token
    mode === "development" && {
      name: "local-api-google-token",
      configureServer(server: ViteDevServer) {
        server.middlewares.use("/api/google/token", (req: any, res: any, next: any) => {
          if (req.method !== "GET") return next();

          process.env.GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
          process.env.GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
          process.env.GOOGLE_REFRESH_TOKEN = env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

          const wrapResponse = (res: any) =>
            Object.assign(res, {
              status(code: number) { res.statusCode = code; return res; },
              json(obj: any) { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); },
            });

          Promise.resolve(googleTokenHandler(req, wrapResponse(res))).catch((err: any) => {
            console.error("Local /api/google/token error", err);
            wrapResponse(res).status(500).json({ error: "Internal server error" });
          });
        });
      },
    },
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // 👇 These two ensure every library (Radix, ShadCN, Lucide, etc.)
      // uses the exact same React instance.
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },

  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
    // Bridge non-VITE_ prefixed Replit secrets to import.meta.env
    "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || ''),
    "import.meta.env.VITE_GOOGLE_CLIENT_SECRET": JSON.stringify(env.GOOGLE_CLIENT_SECRET || env.VITE_GOOGLE_CLIENT_SECRET || ''),
    "import.meta.env.VITE_GOOGLE_REFRESH_TOKEN": JSON.stringify(env.GOOGLE_REFRESH_TOKEN || env.VITE_GOOGLE_REFRESH_TOKEN || ''),
  },

  build: {
    sourcemap: true, // <-- important for debugging Vercel errors
    minify: "esbuild",
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    target: "es2020",
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        // ✅ Let Vite automatically decide chunking
        // (manualChunks can isolate React inside radix-ui bundle, breaking forwardRef)
        manualChunks: undefined,

        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@radix-ui/react-slot",
      "@radix-ui/react-primitive",
    ],
    force: true,
  },

  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
    treeShaking: true,
    legalComments: "none",
  },
}});