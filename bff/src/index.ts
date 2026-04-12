import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";
import { runMigrations } from "./db/migrate.js";
import { createAuthRouter } from "./auth/google.js";
import { createSessionsRouter } from "./routes/sessions.js";
import { createShareRouter, createPublicShareRouter } from "./routes/share.js";
import { createStatsRouter } from "./routes/stats.js";
import { buildInfo } from "./build-info.js";

const app = new Hono();

const DRUG_GATE_URL = process.env.DRUG_GATE_URL;
const DRUG_GATE_API_KEY = process.env.DRUG_GATE_API_KEY;
const PORT = Number(process.env.PORT) || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

if (!CORS_ORIGIN) {
  console.warn("CORS_ORIGIN not set — defaulting to same-origin only");
}

if (!DRUG_GATE_URL || !DRUG_GATE_API_KEY) {
  console.error("Missing required env vars: DRUG_GATE_URL, DRUG_GATE_API_KEY");
  process.exit(1);
}

// Security headers
app.use("/*", secureHeaders());

if (CORS_ORIGIN) {
  app.use("/*", cors({ origin: CORS_ORIGIN, credentials: true }));
}

const healthResponse = {
  status: "healthy",
  ...buildInfo,
  node_version: process.version,
  os: process.platform,
  arch: process.arch,
};

app.get("/health", (c) => c.json(healthResponse));
app.get("/api/health", (c) => c.json(healthResponse));

// Auth routes: /api/auth/*
const authRouter = createAuthRouter();
app.route("/api/auth", authRouter);

// Session routes: /api/sessions/*
const sessionsRouter = createSessionsRouter();
app.route("/api/sessions", sessionsRouter);

// Stats routes: /api/stats
const statsRouter = createStatsRouter();
app.route("/api/stats", statsRouter);

// Share routes: /api/sessions/:id/share (authenticated) + /s/:token (public)
const shareRouter = createShareRouter();
app.route("/api/sessions", shareRouter);
const publicShareRouter = createPublicShareRouter();
app.route("/s", publicShareRouter);

const UPSTREAM_TIMEOUT_MS = 10_000;

app.get("/api/v1/*", async (c) => {
  const url = new URL(c.req.url);
  const upstreamPath = decodeURIComponent(url.pathname).replace(/^\/api/, "");

  // Block path traversal — only allow /v1/* paths
  if (!upstreamPath.startsWith("/v1/") && upstreamPath !== "/v1") {
    return c.json({ error: "not_found", message: "Invalid API path" }, 404);
  }

  const upstreamUrl = `${DRUG_GATE_URL}${upstreamPath}${url.search}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        "X-API-Key": DRUG_GATE_API_KEY!,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return c.json({ error: "proxy_timeout", message: "Upstream API timed out" }, 504);
    }
    console.error("Proxy error:", err);
    return c.json({ error: "proxy_error", message: "Failed to reach upstream API" }, 502);
  } finally {
    clearTimeout(timeout);
  }
});

async function start() {
  try {
    await runMigrations();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }

  serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`BFF proxy listening on :${PORT}`);
  });
}

start();
