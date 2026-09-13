import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { List, ListItem } from "@astryxdesign/core/List";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { useTranslator } from "@astryxdesign/core/i18n";
import type { Greeting } from "@/core/types/greeting";
import { useState, useTransition } from "react";
import { PageContainer, PageHeader } from "./layout";

interface GreetingPanelProps {
  readonly greetings: Greeting[];
  readonly onCreate: (message: string) => Promise<void>;
}

export function GreetingPanel({ greetings, onCreate }: GreetingPanelProps) {
  const t = useTranslator();
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
      setError(cause instanceof Error ? cause.message : t("agentdock.hello.error.save"));
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("agentdock.hello.title")}
        description={t("agentdock.hello.description")}
      />

      <Section padding={4}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(submit);
          }}
        >
          <Stack gap={4}>
            <TextInput
              label={t("agentdock.hello.newGreeting")}
              value={message}
              onChange={setMessage}
              placeholder={t("agentdock.hello.placeholder")}
              isRequired
              status={error ? { type: "error", message: error } : undefined}
            />
            <Stack direction="horizontal" hAlign="end">
              <Button
                label={t("agentdock.hello.add")}
                type="submit"
                variant="primary"
                isLoading={isPending}
                isDisabled={!message.trim()}
              />
            </Stack>
          </Stack>
        </form>
      </Section>

      {greetings.length === 0 ? (
        <EmptyState title={t("agentdock.hello.empty")} headingLevel={2} />
      ) : (
        <List
          density="balanced"
          hasDividers
          header={<Heading level={2}>{t("agentdock.hello.stored")}</Heading>}
        >
          {greetings.map((greeting) => (
            <ListItem
              key={greeting.id}
              label={greeting.message}
              description={
                <Timestamp
                  value={greeting.createdAt.toISOString()}
                  format="date_time"
                  type="supporting"
                  color="secondary"
                />
              }
            />
          ))}
        </List>
      )}
    </PageContainer>
  );
}
