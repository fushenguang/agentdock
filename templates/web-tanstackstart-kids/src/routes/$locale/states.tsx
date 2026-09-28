import { KidStatesPage } from "@/components/kids";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/states")({
  component: KidStatesPage,
});
