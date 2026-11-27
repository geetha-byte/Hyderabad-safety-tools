import argon2 from "argon2";
import { localDb } from "./local-db.server";
import { createLocalSession, destroyLocalSession } from "./local-auth.server";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export async function registerLocalUser(
  email: string,
  password: string,
  fullName: string,
) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password || !fullName.trim()) {
    throw new Error("Email, password, and full name are required.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = await localDb`
    SELECT id FROM public.users
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `;

  if (existing.length > 0) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);

  const users = await localDb`
    INSERT INTO public.users (email, password_hash, full_name)
    VALUES (${normalizedEmail}, ${passwordHash}, ${fullName.trim()})
    RETURNING id, email, full_name, email_verified, is_active
  `;

  return users[0];
}


export async function loginLocalUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const users = await localDb`
    SELECT id, email, full_name, password_hash, email_verified, is_active
    FROM public.users
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `;

  const user = users[0];

  if (!user || !user["is_active"]) {
    throw new Error("Invalid email or password.");
  }

  const validPassword = await verifyPassword(user["password_hash"], password);

  if (!validPassword) {
    throw new Error("Invalid email or password.");
  }

  if (!user["email_verified"]) {
    throw new Error("Please verify your email before logging in.");
  }

  await createLocalSession(user["id"]);

  return {
    id: user["id"],
    email: user["email"],
    fullName: user["full_name"],
  };
}


export async function logoutLocalUser() {
  await destroyLocalSession();
}

export async function isLocalUserAdmin(userId: string): Promise<boolean> {
  const roles = await localDb`SELECT 1 FROM public.user_roles WHERE user_id = ${userId} AND role = 'admin' LIMIT 1`;
  return roles.length > 0;
}
