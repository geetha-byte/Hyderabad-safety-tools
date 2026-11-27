import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { localDb } from "./src/lib/local-db.server.ts";
import argon2 from "argon2";

const email = "manojenterprisesinfo@gmail.com";
const fullName = "Manoj Enterprises";

function readHiddenPassword() {
  return new Promise((resolve) => {
    stdout.write("Admin password: ");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let password = "";

    const onData = (char) => {
      if (char === "\u0003") process.exit();
      if (char === "\r" || char === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        stdout.write("\n");
        resolve(password);
      } else if (char === "\u007f") {
        password = password.slice(0, -1);
      } else {
        password += char;
      }
    };

    stdin.on("data", onData);
  });
}

const password = await readHiddenPassword();

if (password.length < 12) {
  console.log("Use at least 12 characters.");
  await localDb.end();
  process.exit(1);
}

const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
});

try {
  await localDb.begin(async (tx) => {
    const existing = await tx`
      SELECT id FROM public.users
      WHERE lower(email) = lower(${email})
      LIMIT 1
    `;

    if (existing.length) throw new Error("Account already exists.");

    const rows = await tx`
      INSERT INTO public.users
        (email, password_hash, full_name, email_verified, is_active)
      VALUES (${email}, ${hash}, ${fullName}, true, true)
      RETURNING id
    `;

    await tx`
      INSERT INTO public.user_roles (user_id, role)
      VALUES (${rows[0].id}, 'admin')
    `;
  });

  console.log("Admin account created successfully.");
} catch (error) {
  console.error("Failed:", error.message);
} finally {
  await localDb.end();
}
