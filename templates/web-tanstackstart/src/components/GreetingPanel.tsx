import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { TextInput } from "@astryxdesign/core/TextInput";
import * as stylex from "@stylexjs/stylex";
import type { Greeting } from "@/core/types/greeting";
import { useState, useTransition } from "react";

function formatTimestamp(date: Date): string {
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

const styles = stylex.create({
  page: {
    minHeight: "100vh",
    padding: {
      default: 20,
      "@media (min-width: 768px)": 40,
    },
    display: "grid",
    placeItems: "start center",
  },
  content: {
    width: "100%",
    maxWidth: 760,
    display: "grid",
    gap: 24,
  },
  hero: {
    display: "grid",
    gap: 8,
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
    lineHeight: 1.6,
    margin: 0,
    maxWidth: 640,
  },
  form: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 560px)": "1fr auto",
    },
    alignItems: "end",
  },
  list: {
    display: "grid",
    gap: 12,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  listItem: {
    borderBottomColor: "var(--color-border)",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "grid",
    gap: 4,
    paddingBottom: 12,
  },
  message: {
    color: "var(--color-text-primary)",
    fontSize: 16,
    margin: 0,
  },
  timestamp: {
    color: "var(--color-text-secondary)",
    fontSize: 13,
  },
});

interface GreetingPanelProps {
  readonly greetings: Greeting[];
  readonly onCreate: (message: string) => Promise<void>;
}

export function GreetingPanel({ greetings, onCreate }: GreetingPanelProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submit() {
    const nextMessage = message;
    if (!nextMessage.trim()) return;

    try {
      await onCreate(nextMessage);
      startTransition(() => {
        setMessage("");
        setError(null);
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save the greeting");
    }
  }

  return (
    <main {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.content)}>
        <header {...stylex.props(styles.hero)}>
          <p {...stylex.props(styles.eyebrow)}>AgentDock / TanStack Start</p>
          <Heading level={1}>A typed full-stack baseline</Heading>
          <p {...stylex.props(styles.copy)}>
            TanStack Start handles routing and server functions. Drizzle keeps the repository
            contract explicit, while Astryx and StyleX provide the interface foundation.
          </p>
        </header>

        <Card padding={4}>
          <form
            {...stylex.props(styles.form)}
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(submit);
            }}
          >
            <TextInput
              label="New greeting"
              value={message}
              onChange={setMessage}
              placeholder="Write something worth persisting"
              isRequired
            />
            <Button
              label="Add greeting"
              type="submit"
              variant="primary"
              isLoading={isPending}
              isDisabled={!message.trim()}
            />
            {error ? <p role="alert">{error}</p> : null}
          </form>
        </Card>

        <section aria-labelledby="greetings-heading">
          <Heading level={2}>Stored greetings</Heading>
          {greetings.length === 0 ? (
            <p {...stylex.props(styles.copy)}>No greetings yet. The SQLite default starts empty.</p>
          ) : (
            <ul {...stylex.props(styles.list)}>
              {greetings.map((greeting) => (
                <li key={greeting.id} {...stylex.props(styles.listItem)}>
                  <p {...stylex.props(styles.message)}>{greeting.message}</p>
                  <time
                    {...stylex.props(styles.timestamp)}
                    dateTime={greeting.createdAt.toISOString()}
                  >
                    {formatTimestamp(greeting.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
