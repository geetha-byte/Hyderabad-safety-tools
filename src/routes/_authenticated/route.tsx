import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { localCurrentSession } from "@/lib/local-auth-api.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const user = await localCurrentSession();

    if (!user) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
  },
  component: () => <Outlet />,
});
