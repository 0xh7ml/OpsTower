import { sign, verify } from "hono/jwt";
import type { MiddlewareHandler } from "hono";
import type { Env } from "./types";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
// Workers' WebCrypto caps PBKDF2 at 100k iterations
const PBKDF2_ITERATIONS = 100_000;

const toHex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) =>
  new Uint8Array(hex.match(/../g)!.map((h) => parseInt(h, 16)));

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt.buffer)}$${toHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [, iterations, salt, hash] = stored.split("$");
  const candidate = toHex(await derive(password, fromHex(salt), Number(iterations)));
  // constant-time compare
  let diff = candidate.length ^ hash.length;
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ (hash.charCodeAt(i) || 0);
  return diff === 0;
}

export type TokenType = "access" | "refresh";

export function issueToken(userId: number, type: TokenType, secret: string) {
  const now = Math.floor(Date.now() / 1000);
  return sign({ sub: String(userId), type, iat: now, exp: now + TOKEN_TTL_SECONDS }, secret);
}

export async function verifyToken(token: string, type: TokenType, secret: string) {
  try {
    const payload = await verify(token, secret, "HS256");
    return payload.type === type ? Number(payload.sub) : null;
  } catch {
    return null;
  }
}

export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: { userId: number } }> = async (c, next) => {
  const header = c.req.header("Authorization") ?? "";
  const [scheme, token] = header.split(" ");
  const userId = scheme === "Bearer" && token ? await verifyToken(token, "access", c.env.JWT_SECRET) : null;
  if (userId === null) {
    return c.json({ detail: "Authentication credentials were not provided or are invalid." }, 401);
  }
  c.set("userId", userId);
  await next();
};
