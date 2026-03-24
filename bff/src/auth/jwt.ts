import { SignJWT, jwtVerify } from "jose";

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY_DAYS = 30;

let secretKey: Uint8Array | null = null;

function getSecretKey(): Uint8Array {
  if (secretKey) return secretKey;
  if (!JWT_SECRET) {
    throw new Error("Missing required env var: JWT_SECRET");
  }
  secretKey = new TextEncoder().encode(JWT_SECRET);
  return secretKey;
}

/** Override the secret key (for testing) */
export function setSecretKeyForTest(secret: string): void {
  secretKey = new TextEncoder().encode(secret);
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
    const { payload } = await jwtVerify(token, getSecretKey());
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
