import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
  },
  content: {
    display: "grid",
    gap: 24,
    maxWidth: 720,
  },
  eyebrow: {
    color: "var(--color-text-secondary)",
    fontSize: 13,
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase",
  },
  copy: {
    color: "var(--color-text-secondary)",
    fontSize: 18,
    lineHeight: 1.65,
    margin: 0,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
});

export function LandingPage() {
  return (
    <main {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.content)}>
        <p {...stylex.props(styles.eyebrow)}>AgentDock web-tanstackstart</p>
        <Heading level={1} type="display-2">
          Native-speed building for internal web products
        </Heading>
        <p {...stylex.props(styles.copy)}>
          TanStack Start, TypeScript 7, Vite 8, Oxlint, Oxfmt, Astryx and Drizzle form one fast
          verification loop. SQLite is the default; Supabase Postgres is one switch away.
        </p>
        <div {...stylex.props(styles.actions)}>
          <Button label="Open the hello feature" variant="primary" href="/hello" />
        </div>
      </div>
    </main>
  );
}
