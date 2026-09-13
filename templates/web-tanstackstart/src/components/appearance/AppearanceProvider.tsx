import { Theme } from "@astryxdesign/core/theme";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  THEME_OPTIONS,
  type AppearanceMode,
  type AppearanceState,
  type ThemeName,
} from "./appearance";
import { persistAppearance, readAppearanceCookie } from "./appearance-persistence";

interface AppearanceContextValue extends AppearanceState {
  readonly setThemeName: (theme: ThemeName) => void;
  readonly setMode: (mode: AppearanceMode) => void;
}

interface AppearanceProviderProps {
  readonly initialAppearance: AppearanceState;
  readonly children: ReactNode;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ initialAppearance, children }: AppearanceProviderProps) {
  const [appearance, setAppearance] = useState(initialAppearance);

  useEffect(() => {
    const syncAppearance = () => {
      const nextAppearance = readAppearanceCookie();
      setAppearance((currentAppearance) =>
        currentAppearance.themeName === nextAppearance.themeName &&
        currentAppearance.mode === nextAppearance.mode
          ? currentAppearance
          : nextAppearance,
      );
    };

    window.addEventListener("focus", syncAppearance);
    return () => window.removeEventListener("focus", syncAppearance);
  }, []);

  const value = useMemo<AppearanceContextValue>(() => {
    const updateAppearance = (nextAppearance: AppearanceState) => {
      if (
        nextAppearance.themeName === appearance.themeName &&
        nextAppearance.mode === appearance.mode
      ) {
        return;
      }

      setAppearance(nextAppearance);
      persistAppearance(nextAppearance);
    };

    return {
      ...appearance,
      setThemeName: (themeName) => updateAppearance({ ...appearance, themeName }),
      setMode: (mode) => updateAppearance({ ...appearance, mode }),
    };
  }, [appearance]);

  return (
    <AppearanceContext value={value}>
      <Theme theme={THEME_OPTIONS[appearance.themeName].theme} mode={appearance.mode}>
        {children}
      </Theme>
    </AppearanceContext>
  );
}

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used within AppearanceProvider");
  }
  return context;
}
