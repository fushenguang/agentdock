import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Button } from "@astryxdesign/core/Button";
import { useState } from "react";

interface GuardianGateProps {
  readonly triggerLabel: string;
  readonly title: string;
  readonly description: string;
  readonly cancelLabel: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => void | Promise<void>;
}

export function GuardianGate({
  triggerLabel,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
}: GuardianGateProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button label={triggerLabel} variant="secondary" onClick={() => setIsOpen(true)} />
      <AlertDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title={title}
        description={description}
        cancelLabel={cancelLabel}
        actionLabel={confirmLabel}
        actionVariant="primary"
        onAction={async () => {
          try {
            await onConfirm();
          } catch (error) {
            console.error("[agentdock] guardian confirmation failed", error);
          } finally {
            setIsOpen(false);
          }
        }}
      />
    </>
  );
}
