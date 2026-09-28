import { KidHomePage } from "@/components/kids";
import { listActivityCompletions } from "@/features/activity-progress";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/")({
  loader: () => listActivityCompletions(),
  component: HomeRoute,
});

function HomeRoute() {
  const completions = Route.useLoaderData();
  return <KidHomePage completionCount={completions.length} />;
}
