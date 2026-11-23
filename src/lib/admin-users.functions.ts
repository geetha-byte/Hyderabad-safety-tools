import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { inviteUserInput, userRoleInput } from "@/lib/admin-users";

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { page: number }) => ({ page: Math.max(1, Math.floor(input.page || 1)) }))
  .handler(async ({ data, context }) => {
    // Runs through an admin-checked database function so it also works without the private server key (local runs).
    const { data: rows, error } = await context.supabase.rpc("admin_list_users", { _page: data.page });
    if (error) throw new Error(error.message.includes("Admin access") ? "Admin access required" : "Could not load users");
    const list = rows ?? [];
    return { actorId: context.userId, hasNext: list.length > 20, users: list.slice(0, 20).map(user => ({
      id: user.id, email: user.email ?? "", verified: user.verified, createdAt: user.created_at,
      role: user.is_admin ? "admin" as const : "user" as const,
    })) };
  });

export const inviteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; redirectTo: string }) => inviteUserInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: allowed, error: accessError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (accessError || !allowed) throw new Error("Admin access required");
    const redirect = new URL(data.redirectTo);
    if (redirect.origin !== getRequestUrl().origin || redirect.pathname !== "/auth/setup") throw new Error("Invalid invitation destination");
    if (process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, { redirectTo: redirect.href });
      if (error) throw new Error("Could not invite this user. Check whether the email already has an account, or try again later.");
    } else {
      // Local fallback: no private key, so send a sign-in link that creates the account.
      const { error } = await context.supabase.auth.signInWithOtp({ email: data.email, options: { emailRedirectTo: redirect.href, shouldCreateUser: true } });
      if (error) throw new Error("Could not send the sign-in link. Try again later.");
    }
    return { success: true };
  });

export const changeUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "user" | "admin" }) => userRoleInput.parse(input))
  .handler(async ({ data, context }) => {
    // Role rules (admin caller, not self, owner protected, verified before admin) are enforced inside the database function.
    const { error } = await context.supabase.rpc("admin_set_user_role", { _user_id: data.userId, _make_admin: data.role === "admin" });
    if (error) throw new Error(error.message || "Could not save the role");
    return { success: true };
  });
