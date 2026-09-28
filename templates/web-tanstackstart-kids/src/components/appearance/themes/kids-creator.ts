import { defineTheme } from "@astryxdesign/core/theme";
import { kidsBaseTheme, kidsFallbackStack } from "./kids-base";

export const kidsCreatorTheme = defineTheme({
  name: "kids-creator",
  extends: kidsBaseTheme,
  typography: {
    scale: { base: 16, ratio: 1.22 },
    body: { family: "Nunito Variable", fallbacks: kidsFallbackStack, weight: "medium" },
    heading: { family: "Nunito Variable", fallbacks: kidsFallbackStack, weight: "bold" },
  },
  motion: { fast: 140, medium: 240, slow: 440, ratio: 0.78 },
  tokens: {
    "--size-element-sm": "32px",
    "--size-element-md": "44px",
    "--size-element-lg": "52px",
    "--focus-outline-width": "2px",
  },
  components: {
    "date-input": { base: { minHeight: "44px", paddingInline: "18px" } },
    "time-input": { base: { minHeight: "44px", paddingInline: "18px" } },
    "file-input": { base: { minHeight: "56px" } },
    pagination: { base: { minHeight: "44px" } },
    "table-cell": { base: { minHeight: "44px" } },
    "table-header-cell": { base: { minHeight: "44px" } },
    button: { base: { minHeight: "44px", paddingInline: "18px" } },
    "checkbox-input": { base: { minHeight: "44px" } },
    "checkbox-indicator": { base: { borderRadius: "8px", height: "24px", width: "24px" } },
    "radio-indicator": { base: { height: "24px", width: "24px" } },
    "radio-list-item": { base: { minHeight: "44px" } },
    "switch-field": { base: { minHeight: "44px" } },
    "text-input": { base: { minHeight: "44px", paddingInline: "18px" } },
    selector: { base: { minHeight: "44px" } },
    "selector-option-row": { base: { minHeight: "40px" } },
    "tab-list": { base: { minHeight: "44px" } },
    tab: { base: { minHeight: "38px" } },
    "collapsible-trigger": { base: { minHeight: "44px" } },
    token: { base: { minHeight: "36px" } },
    card: { base: { padding: "18px" } },
    dialog: { base: { padding: "18px" } },
  },
});
