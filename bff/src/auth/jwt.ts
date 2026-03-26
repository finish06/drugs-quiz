import { SignJWT, jwtVerify } from "jose";

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

const JWT_EXPIRY_DAYS = 30;

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing required env var: JWT_SECRET");
  }
  return new TextEncoder().encode(secret);
}

/** Sign a JWT with user claims, 30-day expiry */
export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRY_DAYS}d`)
    .sign(getSecretKey());
}

/** Verify a JWT and return the payload, or null if invalid/expired */
export async function verifyJwt(
  token: string
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub || !payload.email) return null;
    return {
      sub: payload.sub,
      email: payload.email as string,
      name: (payload.name as string) || "",
    };
  } catch {
    return null;
  }
}
