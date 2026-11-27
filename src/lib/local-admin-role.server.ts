import type { Sql } from "postgres";
import { assertRoleChange } from "./admin-users";

type RoleChange = {
  userId: string;
  role: "user" | "admin";
};

export async function changeUserRoleInDatabase(
  db: Sql,
  actorId: string,
  data: RoleChange,
) {
  await db.begin(async (tx) => {
    // Serialize role changes to prevent concurrent last-admin demotions.
    await tx`SELECT pg_advisory_xact_lock(73190421, 1)`;

    const targets = await tx`
      SELECT id, email, email_verified AS verified
      FROM public.users
      WHERE id = ${data.userId}
      FOR UPDATE
    `;

    const target = targets[0];

    if (!target) {
      throw new Error("User not found.");
    }

    assertRoleChange(
      actorId,
      {
        id: target["id"],
        email: target["email"],
        verified: target["verified"],
      },
      data.role,
    );

    if (data.role === "admin") {
      await tx`
        INSERT INTO public.user_roles (user_id, role)
        VALUES (${data.userId}, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING
      `;
      return;
    }

    const admins = await tx`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE user_id = ${data.userId})::int AS target_count
      FROM public.user_roles
      WHERE role = 'admin'
    `;

    if (
      Number(admins[0]?.["target_count"] ?? 0) > 0 &&
      Number(admins[0]?.["total"] ?? 0) <= 1
    ) {
      throw new Error("At least one administrator must remain.");
    }

    await tx`
      DELETE FROM public.user_roles
      WHERE user_id = ${data.userId} AND role = 'admin'
    `;
  });

  return { success: true };
}
