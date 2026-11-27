import { getLocalSession } from "./local-auth.server";
import { isLocalUserAdmin } from "./local-auth-service.server";

export async function requireLocalAdmin() {
  const session = await getLocalSession();

  if (!session) {
    throw new Error("Unauthorized: Login required");
  }

  const isAdmin = await isLocalUserAdmin(session["user_id"]);

  if (!isAdmin) {
    throw new Error("Forbidden: Admin access required");
  }

  return {
    userId: session["user_id"],
    email: session["email"],
    fullName: session["full_name"],
  };
}
