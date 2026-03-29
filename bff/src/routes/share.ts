import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { authMiddleware } from "../auth/middleware.js";
import { db } from "../db/index.js";
import { quizSessions, users } from "../db/schema.js";

const QUIZ_TYPE_LABELS: Record<string, string> = {
  "name-the-class": "Name the Class",
  "match-drug-to-class": "Match Drug to Class",
  "brand-generic-match": "Brand/Generic Match",
  "quick-5": "Quick 5",
};

function generateToken(): string {
  return randomBytes(6).toString("base64url").slice(0, 10);
}

/** Authenticated routes for share token generation: mounted at /api/sessions */
export function createShareRouter(): Hono {
  const router = new Hono();

  // POST /api/sessions/:id/share — generate or retrieve share token
  router.post("/:id/share", authMiddleware, async (c) => {
    const sessionId = c.req.param("id")!;
    const user = c.get("user");

    const rows = await db
      .select({
        id: quizSessions.id,
        userId: quizSessions.userId,
        shareToken: quizSessions.shareToken,
      })
      .from(quizSessions)
      .where(eq(quizSessions.id, sessionId))
      .limit(1);

    if (rows.length === 0) {
      return c.json({ error: "not_found", message: "Session not found" }, 404);
    }

    const session = rows[0];

    if (session.userId !== user.sub) {
      return c.json({ error: "forbidden", message: "Session does not belong to you" }, 403);
    }

    // Return existing token if already shared
    if (session.shareToken) {
      return c.json({
        shareToken: session.shareToken,
        shareUrl: `/s/${session.shareToken}`,
      });
    }

    // Generate new token
    const token = generateToken();
    const updated = await db
      .update(quizSessions)
      .set({ shareToken: token })
      .where(eq(quizSessions.id, sessionId))
      .returning({ shareToken: quizSessions.shareToken });

    const shareToken = updated[0].shareToken;

    return c.json({
      shareToken,
      shareUrl: `/s/${shareToken}`,
    });
  });

  return router;
}

/** Public routes for viewing shared results: mounted at /s */
export function createPublicShareRouter(): Hono {
  const router = new Hono();

  // GET /s/:token — render public share page
  router.get("/:token", async (c) => {
    const token = c.req.param("token");

    const rows = await db
      .select({
        quizType: quizSessions.quizType,
        questionCount: quizSessions.questionCount,
        correctCount: quizSessions.correctCount,
        percentage: quizSessions.percentage,
        completedAt: quizSessions.completedAt,
        userName: users.name,
      })
      .from(quizSessions)
      .innerJoin(users, eq(quizSessions.userId, users.id))
      .where(eq(quizSessions.shareToken, token))
      .limit(1);

    if (rows.length === 0) {
      return c.html(render404Page(), 404);
    }

    const data = rows[0];
    const name = data.userName?.slice(0, 50) || "Someone";
    const quizLabel = QUIZ_TYPE_LABELS[data.quizType] || data.quizType;
    const dateStr = new Date(data.completedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const ogTitle = `${name} scored ${Math.round(data.percentage)}% on ${quizLabel}`;
    const ogDescription = `${data.correctCount}/${data.questionCount} correct on Rx Quiz — ${quizLabel}`;
    const appUrl = process.env.APP_URL || "";
    const shareUrl = `${appUrl}/s/${token}`;

    return c.html(renderSharePage({
      name,
      percentage: Math.round(data.percentage),
      quizLabel,
      correctCount: data.correctCount,
      questionCount: data.questionCount,
      dateStr,
      ogTitle,
      ogDescription,
      shareUrl,
      appUrl,
    }));
  });

  return router;
}

interface SharePageData {
  name: string;
  percentage: number;
  quizLabel: string;
  correctCount: number;
  questionCount: number;
  dateStr: string;
  ogTitle: string;
  ogDescription: string;
  shareUrl: string;
  appUrl: string;
}

function renderSharePage(d: SharePageData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(d.ogTitle)} — Rx Quiz</title>
  <meta property="og:title" content="${escapeHtml(d.ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(d.ogDescription)}" />
  <meta property="og:url" content="${escapeHtml(d.shareUrl)}" />
  <meta property="og:site_name" content="Rx Quiz" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(d.ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(d.ogDescription)}" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      color: #111827;
      padding: 1rem;
    }
    @media (prefers-color-scheme: dark) {
      body { background: #111827; color: #f3f4f6; }
      .card { background: #1f2937; border-color: #374151; }
      .stat-box { background: #111827; border-color: #374151; }
      .cta { background: #3b82f6; }
      .cta:hover { background: #2563eb; }
      .footer { color: #9ca3af; }
    }
    .card {
      max-width: 480px;
      width: 100%;
      background: #fff;
      border-radius: 1rem;
      border: 1px solid #e5e7eb;
      overflow: hidden;
      text-align: center;
    }
    .header { padding: 1.5rem; border-bottom: 1px solid #e5e7eb; }
    @media (prefers-color-scheme: dark) { .header { border-color: #374151; } }
    .logo { font-size: 1.25rem; font-weight: 700; }
    .body { padding: 2rem 1.5rem; }
    .name { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .score { font-size: 3rem; font-weight: 800; color: ${getScoreColor(d.percentage)}; }
    .quiz-type { color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem; }
    .stat-box {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1rem 2rem;
      margin: 1.5rem 0;
    }
    .stat-num { font-size: 1.5rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: #6b7280; }
    .date { color: #9ca3af; font-size: 0.75rem; margin-bottom: 1.5rem; }
    .cta {
      display: inline-block;
      background: #3b82f6;
      color: #fff;
      font-weight: 600;
      padding: 0.75rem 2rem;
      border-radius: 0.75rem;
      text-decoration: none;
      transition: background 0.15s;
    }
    .cta:hover { background: #2563eb; }
    .footer { padding: 1rem; font-size: 0.75rem; color: #6b7280; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">💊 Rx Quiz</div>
    </div>
    <div class="body">
      <div class="name">${escapeHtml(d.name)} scored ${d.percentage}%</div>
      <div class="quiz-type">on ${escapeHtml(d.quizLabel)}</div>
      <div class="stat-box">
        <span class="stat-num">${d.correctCount} / ${d.questionCount}</span>
        <span class="stat-label">correct</span>
      </div>
      <div class="date">Completed ${escapeHtml(d.dateStr)}</div>
      <a href="${escapeHtml(d.appUrl)}" class="cta">Try Rx Quiz →</a>
    </div>
    <div class="footer">A free study tool for pharmacy professionals</div>
  </div>
</body>
</html>`;
}

function render404Page(): string {
  const appUrl = process.env.APP_URL || "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Quiz result not found — Rx Quiz</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      color: #111827;
      padding: 1rem;
    }
    @media (prefers-color-scheme: dark) {
      body { background: #111827; color: #f3f4f6; }
      .card { background: #1f2937; border-color: #374151; }
      .cta { background: #3b82f6; }
    }
    .card {
      max-width: 480px;
      width: 100%;
      background: #fff;
      border-radius: 1rem;
      border: 1px solid #e5e7eb;
      text-align: center;
      padding: 2rem;
    }
    .logo { font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem; }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    p { color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .cta {
      display: inline-block;
      background: #3b82f6;
      color: #fff;
      font-weight: 600;
      padding: 0.75rem 2rem;
      border-radius: 0.75rem;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">💊 Rx Quiz</div>
    <h1>Quiz result not found</h1>
    <p>This result doesn't exist or has been removed.</p>
    <a href="${escapeHtml(appUrl)}" class="cta">Go to Rx Quiz →</a>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getScoreColor(pct: number): string {
  if (pct >= 80) return "#16a34a";
  if (pct >= 60) return "#d97706";
  return "#dc2626";
}
