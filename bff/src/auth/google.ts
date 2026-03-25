import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { Google } from "arctic";
import { eq } from "drizzle-orm";
import { signJwt } from "./jwt.js";
import { authMiddleware } from "./middleware.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

const APP_URL = process.env.APP_URL || "http://localhost:5173";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

function getGoogleClient(): Google {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "Missing required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"
    );
  }
  return new Google(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `${APP_URL}/api/auth/google/callback`
  );
}

/** Create the auth router with all auth endpoints */
export function createAuthRouter(): Hono {
  const auth = new Hono();

  // GET /api/auth/google — redirect to Google consent screen
  auth.get("/google", async (c) => {
    const google = getGoogleClient();
    const state = crypto.randomUUID();
    const scopes = ["openid", "email", "profile"];
    const authUrl = google.createAuthorizationURL(state, "", scopes);

    // Store state in cookie for CSRF validation
    setCookie(c, "oauth_state", state, {
      httpOnly: true,
      secure: APP_URL.startsWith("https"),
      sameSite: "Lax",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    return c.redirect(authUrl.toString());
  });

  // GET /api/auth/google/callback — handle Google's redirect
  auth.get("/google/callback", async (c) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const storedState = getCookie(c, "oauth_state");

    // CSRF validation
    if (!code || !state || !storedState || state !== storedState) {
      deleteCookie(c, "oauth_state");
      return c.redirect(`${APP_URL}?auth_error=invalid_state`);
    }

    deleteCookie(c, "oauth_state");

    try {
      const google = getGoogleClient();
      const tokens = await google.validateAuthorizationCode(code);
      const accessToken = tokens.accessToken();

      // Fetch user profile from Google
      const profileRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!profileRes.ok) {
        return c.redirect(`${APP_URL}?auth_error=profile_fetch_failed`);
      }

      const profile = (await profileRes.json()) as {
        id: string;
        email: string;
        name: string;
        picture: string;
      };

      // Create or update user in database
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, profile.email))
        .limit(1);

      let userId: string;

      if (existingUsers.length > 0) {
        // Update existing user's profile info
        userId = existingUsers[0].id;
        await db
          .update(users)
          .set({
            name: profile.name,
            avatarUrl: profile.picture,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      } else {
        // Create new user
        const inserted = await db
          .insert(users)
          .values({
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.picture,
            oauthProvider: "google",
          })
          .returning({ id: users.id });
        userId = inserted[0].id;
      }

      // Issue JWT
      const token = await signJwt({
        sub: userId,
        email: profile.email,
        name: profile.name,
      });

      setCookie(c, "auth_token", token, {
        httpOnly: true,
        secure: APP_URL.startsWith("https"),
        sameSite: "Lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return c.redirect(APP_URL);
    } catch (err) {
      console.error("OAuth callback error:", err);
      return c.redirect(`${APP_URL}?auth_error=callback_failed`);
    }
  });

  // GET /api/auth/me — return current user info
  auth.get("/me", authMiddleware, async (c) => {
    const jwtUser = c.get("user");

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, jwtUser.sub))
      .limit(1);

    if (userRows.length === 0) {
      return c.json({ error: "not_found", message: "User not found" }, 404);
    }

    const user = userRows[0];
    return c.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });
  });

  // POST /api/auth/logout — clear JWT cookie
  auth.post("/logout", (c) => {
    deleteCookie(c, "auth_token", { path: "/" });
    return c.json({ ok: true });
  });

  return auth;
}
