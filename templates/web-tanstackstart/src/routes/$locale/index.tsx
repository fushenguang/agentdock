import { OverviewLanding } from "@/components/OverviewLanding";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/")({
  component: OverviewLanding,
});
