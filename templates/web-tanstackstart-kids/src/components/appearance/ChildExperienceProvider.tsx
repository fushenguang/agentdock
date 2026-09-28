import { Theme } from "@astryxdesign/core/theme";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  KIDS_PROFILES,
  resolveChildCapabilities,
  type AgeBand,
  type ChildCapabilities,
  type KidsExperienceState,
  type KidsThemeMode,
} from "./kids-experience";
import { persistKidsExperience, readKidsExperienceCookie } from "./kids-experience-persistence";

interface ChildExperienceContextValue extends KidsExperienceState {
  readonly capabilities: ChildCapabilities;
  readonly setAgeBand: (ageBand: AgeBand) => void;
  readonly setMode: (mode: KidsThemeMode) => void;
}

interface ChildExperienceProviderProps {
  readonly initialExperience: KidsExperienceState;
  readonly capabilityOverrides?: Partial<ChildCapabilities>;
  readonly children: ReactNode;
}

const ChildExperienceContext = createContext<ChildExperienceContextValue | null>(null);

export function ChildExperienceProvider({
  initialExperience,
  capabilityOverrides,
  children,
}: ChildExperienceProviderProps) {
  const [experience, setExperience] = useState(initialExperience);

  useEffect(() => {
    const syncExperience = () => {
      const nextExperience = readKidsExperienceCookie();
      setExperience((currentExperience) =>
        currentExperience.ageBand === nextExperience.ageBand &&
        currentExperience.mode === nextExperience.mode
          ? currentExperience
          : nextExperience,
      );
    };

    window.addEventListener("focus", syncExperience);
    return () => window.removeEventListener("focus", syncExperience);
  }, []);

  const value = useMemo<ChildExperienceContextValue>(() => {
    const updateExperience = (nextExperience: KidsExperienceState) => {
      if (
        nextExperience.ageBand === experience.ageBand &&
        nextExperience.mode === experience.mode
      ) {
        return;
      }

      setExperience(nextExperience);
      persistKidsExperience(nextExperience);
    };

    return {
      ...experience,
      capabilities: resolveChildCapabilities(experience.ageBand, capabilityOverrides),
      setAgeBand: (ageBand) => updateExperience({ ...experience, ageBand }),
      setMode: (mode) => updateExperience({ ...experience, mode }),
    };
  }, [capabilityOverrides, experience]);

  return (
    <ChildExperienceContext value={value}>
      <Theme theme={KIDS_PROFILES[experience.ageBand].theme} mode={experience.mode}>
        {children}
      </Theme>
    </ChildExperienceContext>
  );
}

export function useChildExperience(): ChildExperienceContextValue {
  const context = useContext(ChildExperienceContext);
  if (!context) {
    throw new Error("useChildExperience must be used within ChildExperienceProvider");
  }
  return context;
}
