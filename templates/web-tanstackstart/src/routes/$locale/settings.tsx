import { SettingsBoard } from "@/components/settings/SettingsBoard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/settings")({
  component: SettingsBoard,
});
