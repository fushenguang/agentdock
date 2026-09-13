import { GreetingPanel } from "@/components/GreetingPanel";
import { createGreeting, listGreetings } from "@/features/hello";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/hello")({
  loader: () => listGreetings(),
  component: HelloPage,
});

function HelloPage() {
  const greetings = Route.useLoaderData();
  const router = useRouter();

  return (
    <GreetingPanel
      greetings={greetings}
      onCreate={async (message) => {
        await createGreeting({ data: { message } });
        await router.invalidate();
      }}
    />
  );
}
