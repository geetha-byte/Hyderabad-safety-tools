import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";
import { loginLocalUser, logoutLocalUser } from "./local-auth-service.server";
import { getLocalSession } from "./local-auth.server";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const localLogin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => loginSchema.parse(input))
  .handler(async ({ data }) => {
    return await loginLocalUser(data.email, data.password);
  });

export const localLogout = createServerFn({ method: "POST" })
  .handler(async () => {
    await logoutLocalUser();
    return { success: true };
  });

export const localCurrentSession = createServerFn({ method: "GET" })
  .handler(async () => {
    const session = await getLocalSession();
    if (!session) return null;
    return {
      id: session["user_id"],
      email: session["email"],
      fullName: session["full_name"],
    };
  });
