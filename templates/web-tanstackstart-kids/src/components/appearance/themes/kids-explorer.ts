import { defineTheme } from "@astryxdesign/core/theme";
import { kidsBaseTheme, kidsFallbackStack } from "./kids-base";

export const kidsExplorerTheme = defineTheme({
  name: "kids-explorer",
  extends: kidsBaseTheme,
  typography: {
    scale: { base: 18, ratio: 1.24 },
    body: { family: "Nunito Variable", fallbacks: kidsFallbackStack, weight: "medium" },
    heading: { family: "Nunito Variable", fallbacks: kidsFallbackStack, weight: "bold" },
  },
  motion: { fast: 160, medium: 280, slow: 520, ratio: 0.78 },
  tokens: {
    "--size-element-sm": "36px",
    "--size-element-md": "48px",
    "--size-element-lg": "56px",
  },
  components: {
    "date-input": { base: { minHeight: "48px", paddingInline: "20px" } },
    "time-input": { base: { minHeight: "48px", paddingInline: "20px" } },
    "file-input": { base: { minHeight: "64px" } },
    pagination: { base: { minHeight: "48px" } },
    "table-cell": { base: { minHeight: "48px" } },
    "table-header-cell": { base: { minHeight: "48px" } },
    button: { base: { minHeight: "48px", paddingInline: "20px" } },
    "checkbox-input": { base: { minHeight: "48px" } },
    "checkbox-indicator": { base: { borderRadius: "9px", height: "26px", width: "26px" } },
    "radio-indicator": { base: { height: "26px", width: "26px" } },
    "radio-list-item": { base: { minHeight: "48px" } },
    "switch-field": { base: { minHeight: "48px" } },
    "text-input": { base: { minHeight: "48px", paddingInline: "20px" } },
    selector: { base: { minHeight: "48px" } },
    "selector-option-row": { base: { minHeight: "44px" } },
    "tab-list": { base: { minHeight: "48px" } },
    tab: { base: { minHeight: "42px" } },
    "collapsible-trigger": { base: { minHeight: "48px" } },
    token: { base: { minHeight: "40px" } },
    card: { base: { padding: "20px" } },
    dialog: { base: { padding: "20px" } },
  },
});
