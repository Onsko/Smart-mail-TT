import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/client")({
  component: ClientLayout,
});

function ClientLayout() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  if (pathname === "/client/login" || pathname === "/client/forgot-password") {
    return <Outlet />;
  }
  return <AppShell role="CLIENT" />;
}
