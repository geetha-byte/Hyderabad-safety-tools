import { z } from "zod";

export const inviteUserInput = z.object({ email: z.string().trim().email(), redirectTo: z.string().url() });
export const userRoleInput = z.object({ userId: z.string().uuid(), role: z.enum(["user", "admin"]) });

export function assertRoleChange(actorId: string, target: { id: string; email?: string | undefined; verified: boolean }, role: "user" | "admin") {
  if (actorId === target.id) throw new Error("You cannot change your own role.");
  if (target.email?.toLowerCase() === "manojenterprisesinfo@gmail.com") throw new Error("The store owner's admin role cannot be changed.");
  if (role === "admin" && !target.verified) throw new Error("The user must verify their email before becoming an admin.");
}