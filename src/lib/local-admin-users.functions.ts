import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";
import { localDb } from "./local-db.server";
import { requireLocalAdmin } from "./local-admin.server";
import { changeUserRoleInDatabase } from "./local-admin-role.server";

const pageSchema = z.object({
  page: z.number().int().min(1).max(100000),
});

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["user", "admin"]),
});

export const listLocalAdminUsers = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => pageSchema.parse(input))
  .handler(async ({ data }) => {
    const actor = await requireLocalAdmin();
    const offset = (data.page - 1) * 20;

    const rows = await localDb`
      SELECT
        u.id,
        u.email,
        u.email_verified AS verified,
        u.created_at,
        EXISTS (
          SELECT 1
          FROM public.user_roles ur
          WHERE ur.user_id = u.id AND ur.role = 'admin'
        ) AS is_admin
      FROM public.users u
      ORDER BY u.created_at DESC
      LIMIT 21 OFFSET ${offset}
    `;

    return {
      actorId: actor.userId,
      hasNext: rows.length > 20,
      users: rows.slice(0, 20).map((user) => ({
        id: user["id"],
        email: user["email"] ?? "",
        verified: user["verified"],
        createdAt: user["created_at"],
        role: user["is_admin"] ? ("admin" as const) : ("user" as const),
      })),
    };
  });

export const changeLocalUserRole = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => roleSchema.parse(input))
  .handler(async ({ data }) => {
    const actor = await requireLocalAdmin();

    return changeUserRoleInDatabase(localDb, actor.userId, data);
  });
