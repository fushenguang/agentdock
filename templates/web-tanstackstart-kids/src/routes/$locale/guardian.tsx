import { KidGuardianPage } from "@/components/kids";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/guardian")({
  component: KidGuardianPage,
});
