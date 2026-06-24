import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/bo")({
  component: () => <AppShell role="BO" />,
});
