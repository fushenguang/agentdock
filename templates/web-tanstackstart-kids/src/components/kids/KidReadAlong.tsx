import { Button } from "@astryxdesign/core/Button";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useCallback, useEffect, useRef, useState } from "react";

interface KidReadAlongProps {
  readonly text: string;
  readonly readLabel: string;
  readonly stopLabel: string;
  readonly transcriptLabel: string;
  readonly unavailableLabel: string;
}

export function KidReadAlong({
  text,
  readLabel,
  stopLabel,
  transcriptLabel,
  unavailableLabel,
}: KidReadAlongProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const handleSpeechEnd = useCallback(() => setIsSpeaking(false), []);

  useEffect(() => {
    return () => {
      const utterance = utteranceRef.current;
      utterance?.removeEventListener("end", handleSpeechEnd);
      utterance?.removeEventListener("error", handleSpeechEnd);
      utteranceRef.current = null;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [handleSpeechEnd]);

  const stop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const start = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsAvailable(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.addEventListener("end", handleSpeechEnd);
    utterance.addEventListener("error", handleSpeechEnd);
    utteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Stack gap={3}>
      <Stack direction="horizontal" gap={3} wrap="wrap">
        <Button
          label={isSpeaking ? stopLabel : readLabel}
          variant={isSpeaking ? "secondary" : "primary"}
          onClick={isSpeaking ? stop : start}
        />
      </Stack>
      {!isAvailable ? (
        <Text type="supporting" color="secondary">
          {unavailableLabel}
        </Text>
      ) : null}
      <details>
        <summary>{transcriptLabel}</summary>
        <Text type="body">{text}</Text>
      </details>
    </Stack>
  );
}
