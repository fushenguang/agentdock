import { defineTheme } from "@astryxdesign/core/theme";
import { kidsBaseTheme, kidsFallbackStack } from "./kids-base";

export const kidsSproutTheme = defineTheme({
  name: "kids-sprout",
  extends: kidsBaseTheme,
  typography: {
    scale: { base: 20, ratio: 1.24 },
    body: { family: "Nunito Variable", fallbacks: kidsFallbackStack, weight: "medium" },
    heading: { family: "Nunito Variable", fallbacks: kidsFallbackStack, weight: "bold" },
  },
  motion: { fast: 200, medium: 340, slow: 620, ratio: 0.8 },
  tokens: {
    "--size-element-sm": "40px",
    "--size-element-md": "56px",
    "--size-element-lg": "64px",
    "--focus-outline-width": "4px",
  },
  components: {
    "date-input": { base: { minHeight: "56px", paddingInline: "24px" } },
    "time-input": { base: { minHeight: "56px", paddingInline: "24px" } },
    "file-input": { base: { minHeight: "72px" } },
    pagination: { base: { minHeight: "56px" } },
    "table-cell": { base: { minHeight: "56px" } },
    "table-header-cell": { base: { minHeight: "56px" } },
    button: { base: { minHeight: "56px", paddingInline: "24px" } },
    "checkbox-input": { base: { minHeight: "56px" } },
    "checkbox-indicator": { base: { borderRadius: "10px", height: "30px", width: "30px" } },
    "radio-indicator": { base: { height: "30px", width: "30px" } },
    "radio-list-item": { base: { minHeight: "56px" } },
    "switch-field": { base: { minHeight: "56px" } },
    "text-input": { base: { minHeight: "56px", paddingInline: "24px" } },
    selector: { base: { minHeight: "56px" } },
    "selector-option-row": { base: { minHeight: "52px" } },
    "tab-list": { base: { minHeight: "56px" } },
    tab: { base: { minHeight: "48px" } },
    "collapsible-trigger": { base: { minHeight: "56px" } },
    token: { base: { minHeight: "44px" } },
    card: { base: { padding: "24px" } },
    dialog: { base: { padding: "24px" } },
  },
});
