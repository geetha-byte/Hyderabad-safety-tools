import { createHash, randomBytes } from "node:crypto";
import { getCookie, setCookie, deleteCookie } from "@tanstack/start-server-core";
import { localDb } from "./local-db.server";

const SESSION_COOKIE = "shiva_session";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createLocalSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await localDb`
    INSERT INTO public.sessions (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt})
  `;

  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return { expiresAt };
}

export async function getLocalSession() {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;

  const tokenHash = hashToken(token);

  const sessions = await localDb`
    SELECT
      s.id AS session_id,
      s.user_id,
      s.expires_at,
      u.email,
      u.full_name,
      u.email_verified,
      u.is_active
    FROM public.sessions s
    JOIN public.users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
      AND u.is_active = TRUE
      AND u.email_verified = TRUE
    LIMIT 1
  `;

  const session = sessions[0];

  if (!session) {
    deleteCookie(SESSION_COOKIE, { path: "/" });
    return null;
  }

  await localDb`
    UPDATE public.sessions
    SET last_activity_at = NOW()
    WHERE id = ${session["session_id"]}
  `;

  return session;
}

export async function destroyLocalSession() {
  const token = getCookie(SESSION_COOKIE);

  if (token) {
    const tokenHash = hashToken(token);

    await localDb`
      DELETE FROM public.sessions
      WHERE token_hash = ${tokenHash}
    `;
  }

  deleteCookie(SESSION_COOKIE, { path: "/" });
}
