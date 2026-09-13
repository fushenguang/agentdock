import { OverviewPage } from "@/components/OverviewPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/")({
  component: OverviewPage,
});
