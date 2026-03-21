import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";

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

if (CORS_ORIGIN) {
  app.use("/*", cors({ origin: CORS_ORIGIN }));
}

app.get("/health", (c) => c.json({ status: "ok" }));
app.get("/api/health", (c) => c.json({ status: "ok" }));

app.get("/api/v1/*", async (c) => {
  const upstreamPath = c.req.path.replace(/^\/api/, "");
  const query = c.req.url.includes("?") ? "?" + c.req.url.split("?")[1] : "";
  const upstreamUrl = `${DRUG_GATE_URL}${upstreamPath}${query}`;

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        "X-API-Key": DRUG_GATE_API_KEY!,
        "Content-Type": "application/json",
      },
    });

    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return c.json({ error: "proxy_error", message: "Failed to reach upstream API" }, 502);
  }
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`BFF proxy listening on :${PORT}`);
});
