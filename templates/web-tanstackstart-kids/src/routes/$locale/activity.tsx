import { KidActivityPage } from "@/components/kids";
import { listActivityCompletions, recordActivityCompletion } from "@/features/activity-progress";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/activity")({
  loader: () => listActivityCompletions(),
  component: ActivityRoute,
});

function ActivityRoute() {
  const completions = Route.useLoaderData();
  const router = useRouter();

  return (
    <KidActivityPage
      completionCount={completions.length}
      onComplete={async () => {
        await recordActivityCompletion({ data: { activityKey: "shape-sort" } });
        await router.invalidate();
      }}
    />
  );
}
