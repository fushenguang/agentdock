import { getTranslations } from "next-intl/server";
import { greet } from "@/features/hello";
import type { Greeting } from "@/core/types/greeting";

async function loadRecentGreetings(): Promise<Greeting[]> {
  // Gracefully skip DB access when Supabase is not configured.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [];
  }

  try {
    const { SupabaseGreetingRepository } = await import(
      "@/infra/db/SupabaseGreetingRepository"
    );
    const repo = new SupabaseGreetingRepository();
    return await repo.findRecent();
  } catch {
    return [];
  }
}

export default async function HelloPage() {
  const t = await getTranslations("hello");
  const greeting = greet("World");
  const recentGreetings = await loadRecentGreetings();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">{t("title")}</h1>
      <p className="mt-4 text-xl text-gray-700">{greeting}</p>
      <p className="mt-2 text-gray-500">{t("greeting", { name: "World" })}</p>

      {recentGreetings.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Recent greetings</h2>
          <ul className="mt-2 space-y-1">
            {recentGreetings.map((g) => (
              <li key={g.id} className="text-sm text-gray-600">
                {g.name} — {g.createdAt}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
