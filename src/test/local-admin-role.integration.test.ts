import postgres from "postgres";
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { changeUserRoleInDatabase } from "@/lib/local-admin-role.server";

const connectionString = process.env["LOCAL_DATABASE_URL"]

if (!connectionString) {
  throw new Error("LOCAL_DATABASE_URL is missing.");
}

const testUrl = new URL(connectionString);

if (testUrl.pathname !== "/shiva_db") {
  throw new Error("Expected LOCAL_DATABASE_URL to point to shiva_db before deriving the test database.");
}

testUrl.pathname = "/shiva_test_db";

const db = postgres(testUrl.toString(), { max: 4 });

const fixtureIds: string[] = [];

async function createUser(email: string, isAdmin = false) {
  const id = randomUUID();
  fixtureIds.push(id);

  await db`
    INSERT INTO public.users (id, email, password_hash, email_verified)
    VALUES (${id}, ${email}, 'integration-test-placeholder', TRUE)
  `;

  if (isAdmin) {
    await db`
      INSERT INTO public.user_roles (user_id, role)
      VALUES (${id}, 'admin')
    `;
  }

  return id;
}

describe("Local admin role database integration", () => {
  beforeAll(async () => {
    const result = await db`
      SELECT current_database() AS database, current_user AS role
    `;

    if (result[0]?.["database"] !== "shiva_test_db") {
      throw new Error("Safety check failed: refusing to run outside shiva_test_db.");
    }

    if(result[0]?.["role"] !== "shiva_app") {
      throw new Error("Safety check failed: expected the shiva_app database role.");
    }
  });
  afterEach(async () => {
  for (const id of fixtureIds) {
    await db`
      DELETE FROM public.users
      WHERE id = ${id}
    `;
  }

  fixtureIds.length = 0;
});

afterAll(async () => {
  await db.end();
});
  it("prevents demotion of the last administrator", async () => {
    const adminId = await createUser(
      `last-admin-${randomUUID()}@integration.test`,
      true,
    );

    await expect(
      changeUserRoleInDatabase(db, randomUUID(), {
        userId: adminId,
        role: "user",
      }),
    ).rejects.toThrow("At least one administrator must remain.");

    const roles = await db`
      SELECT role FROM public.user_roles WHERE user_id = ${adminId}
    `;

    expect(roles.map((row) => row["role"] )).toContain("admin");
  });

  it("allows demotion when another administrator exists", async () => {
    const firstAdmin = await createUser(
      `admin-one-${randomUUID()}@integration.test`,
      true,
    );
    await createUser(`admin-two-${randomUUID()}@integration.test`, true);

    await expect(
      changeUserRoleInDatabase(db, randomUUID(), {
        userId: firstAdmin,
        role: "user",
      }),
    ).resolves.toEqual({ success: true });

    const roles = await db`
      SELECT role FROM public.user_roles WHERE user_id = ${firstAdmin}
    `;

    expect(roles).toHaveLength(0);
  });

  it("prevents concurrent demotions from removing every administrator", async () => {
    const firstAdmin = await createUser(
      `concurrent-one-${randomUUID()}@integration.test`,
      true,
    );
    const secondAdmin = await createUser(
      `concurrent-two-${randomUUID()}@integration.test`,
      true,
    );

    const actorId = randomUUID();

    const results = await Promise.allSettled([
      changeUserRoleInDatabase(db, actorId, {
        userId: firstAdmin,
        role: "user",
      }),
      changeUserRoleInDatabase(db, actorId, {
        userId: secondAdmin,
        role: "user",
      }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);

    const remaining = await db`
  SELECT COUNT(*)::int AS total
  FROM public.user_roles
  WHERE role = 'admin'
    AND (user_id = ${firstAdmin} OR user_id = ${secondAdmin})
`;
    expect(Number(remaining[0]?.["total"])).toBe(1);
  });
});
