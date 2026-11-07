// astryx-template: dock-settings | package: @cogito.ai/astryx-web | intent: "settings page with sections" | astryx: 0.7.5
import { SettingsBoard } from "@/components/settings/SettingsBoard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/settings")({
  component: SettingsBoard,
});
