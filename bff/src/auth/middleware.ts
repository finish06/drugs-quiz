import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verifyJwt } from "./jwt.js";
import type { JwtPayload } from "./jwt.js";

declare module "hono" {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

/**
 * Auth middleware: verifies JWT from "auth_token" cookie.
 * Sets c.get("user") on success, returns 401 on failure.
 */
export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, "auth_token");
  if (!token) {
    return c.json({ error: "unauthorized", message: "No auth token" }, 401);
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    return c.json({ error: "unauthorized", message: "Invalid or expired token" }, 401);
  }

  c.set("user", payload);
  await next();
}
