import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

const warmFallbacks =
  '"Noto Sans SC Variable", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

export const kidsFallbackStack = `Nunito Variable, ${warmFallbacks}`;

// Astryx semantic icons remain the default. The child experience is expressed
// through theme tokens, component shape, content, and wrappers; a separate
// child icon registry is not needed unless product-specific artwork is added.
export const kidsBaseTheme = defineTheme({
  name: "kids-base",
  extends: neutralTheme,
  color: {
    accent: ["#1F7A68", "#7BE0C1"],
    neutralStyle: "warm",
    contrast: "standard",
  },
  typography: {
    scale: { base: 18, ratio: 1.24 },
    body: {
      family: "Nunito Variable",
      fallbacks: warmFallbacks,
      weight: "medium",
    },
    heading: {
      family: "Nunito Variable",
      fallbacks: warmFallbacks,
      weight: "bold",
      weights: { 1: "bold", 2: "bold", 3: "bold", 4: "semibold" },
    },
  },
  motion: { fast: 160, medium: 280, slow: 520, ratio: 0.78 },
  tokens: {
    "--color-background-body": ["#FFF8E8", "#29241E"],
    "--color-background-surface": ["#FFFDF8", "#332E27"],
    "--color-background-card": ["#FFF6D8", "#3A342B"],
    "--color-background-popover": ["#FFFDF8", "#40392F"],
    "--color-background-muted": ["#F7ECCF", "#453E34"],
    "--color-background-inverted": ["#3E3428", "#FFF3D6"],
    "--color-background-error-inverted": ["#772D29", "#FFD0CC"],
    "--color-accent": ["#1F7A68", "#7BE0C1"],
    "--color-accent-muted": ["#D9F3EC", "#7BE0C133"],
    "--color-on-accent": ["#FFFFFF", "#15352F"],
    "--color-text-accent": ["#185C4F", "#A7F3D0"],
    "--color-icon-accent": ["#1F7A68", "#7BE0C1"],
    "--color-text-primary": ["#3E3428", "#FFF3D6"],
    "--color-text-secondary": ["#766958", "#D8C7A8"],
    "--color-text-disabled": ["#A19480", "#8A7E69"],
    "--color-icon-primary": ["#3E3428", "#FFF3D6"],
    "--color-icon-secondary": ["#766958", "#D8C7A8"],
    "--color-icon-disabled": ["#A19480", "#8A7E69"],
    "--color-border": ["#E6D5B5", "#5A5042"],
    "--color-border-emphasized": ["#C9B58A", "#796C55"],
    "--color-skeleton": ["#E8DCC8", "#51483C"],
    "--color-track": ["#D9C9AA", "#5A5042"],
    "--color-success": ["#357A43", "#8ED98E"],
    "--color-success-muted": ["#DFF3DC", "#8ED98E33"],
    "--color-on-success": ["#FFFFFF", "#17341D"],
    "--color-warning": ["#8C5200", "#FFD166"],
    "--color-warning-muted": ["#FFF0C2", "#FFD16633"],
    "--color-on-warning": ["#FFFFFF", "#3E2D00"],
    "--color-error": ["#B7433D", "#FF8A84"],
    "--color-error-muted": ["#FBE0DD", "#FF8A8433"],
    "--color-on-error": ["#FFFFFF", "#3D1210"],
    "--color-background-blue": ["#DDEFFD", "#31506B"],
    "--color-border-blue": ["#5FA8FF", "#8CC8FF"],
    "--color-icon-blue": ["#2D6FA8", "#9DD3FF"],
    "--color-text-blue": ["#1D527D", "#BDDFFF"],
    "--color-background-green": ["#DDF3D8", "#315A38"],
    "--color-border-green": ["#6FBE44", "#9CDD87"],
    "--color-icon-green": ["#3E8E4C", "#A6E39A"],
    "--color-text-green": ["#2E6938", "#CBF4C5"],
    "--color-background-yellow": ["#FFF0C2", "#6B5315"],
    "--color-border-yellow": ["#E3A008", "#FFD166"],
    "--color-icon-yellow": ["#B66A00", "#FFE29A"],
    "--color-text-yellow": ["#704700", "#FFF0B8"],
    "--color-background-red": ["#FBE0DD", "#6A302D"],
    "--color-border-red": ["#C84B45", "#FF9C96"],
    "--color-icon-red": ["#B7433D", "#FFB4AF"],
    "--color-text-red": ["#772D29", "#FFD0CC"],
    "--shadow-low": "0 2px 0 rgba(92, 65, 37, 0.10), 0 4px 12px rgba(92, 65, 37, 0.08)",
    "--shadow-med": "0 4px 0 rgba(92, 65, 37, 0.10), 0 10px 24px rgba(92, 65, 37, 0.12)",
    "--shadow-high": "0 8px 0 rgba(92, 65, 37, 0.10), 0 20px 40px rgba(92, 65, 37, 0.16)",
    "--radius-inner": "12px",
    "--radius-element": "16px",
    "--radius-container": "24px",
    "--radius-page": "36px",
    "--radius-chat": "32px",
    "--border-width": "2px",
    "--focus-outline-width": "3px",
    "--focus-outline-offset": "3px",
    "--focus-outline-color": "#F5B82E",
    "--ease-standard": "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  components: {
    button: {
      base: {
        borderWidth: "2px",
        fontWeight: "600",
        letterSpacing: "0.02em",
        lineHeight: "1",
        transitionProperty: "transform, box-shadow, background-color, border-color, color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-standard)",
      },
      "size:sm": {
        borderRadius: "16px",
        minHeight: "32px",
        paddingInline: "16px",
      },
      "size:md": {
        borderRadius: "var(--radius-full)",
        minHeight: "45px",
        paddingInline: "20px",
      },
      "size:lg": {
        borderRadius: "24px",
        minHeight: "48px",
        paddingInline: "32px",
      },
      "variant:primary": {
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-background-surface)",
        color: "var(--color-text-primary)",
        boxShadow: "0 5px 0 0 var(--color-border-emphasized)",
        ":hover": {
          backgroundColor: "var(--color-background-surface)",
          borderColor: "var(--color-background-surface)",
          boxShadow: "0 6px 0 0 var(--color-border-emphasized)",
          transform: "translateY(-1px)",
        },
        ":active": {
          backgroundColor: "var(--color-background-surface)",
          borderColor: "var(--color-background-surface)",
          boxShadow: "0 1px 0 0 var(--color-border-emphasized)",
          transform: "translateY(2px)",
        },
        ":focus-visible": {
          outline: "var(--focus-outline-width) solid var(--focus-outline-color)",
          outlineOffset: "var(--focus-outline-offset)",
        },
      },
      "variant:secondary": {
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-border)",
        color: "var(--color-text-primary)",
        boxShadow: "var(--shadow-low)",
        ":hover": {
          borderColor: "var(--color-accent)",
          color: "var(--color-text-accent)",
          boxShadow: "var(--shadow-med)",
          transform: "translateY(-1px)",
        },
      },
      "variant:ghost": {
        backgroundColor: "transparent",
        borderColor: "transparent",
        color: "var(--color-text-primary)",
        boxShadow: "none",
        ":hover": {
          backgroundColor: "var(--color-background-muted)",
        },
      },
      "variant:destructive": {
        backgroundColor: "var(--color-error)",
        borderColor: "var(--color-error)",
        color: "var(--color-on-error)",
        boxShadow: "0 5px 0 0 var(--color-border-emphasized)",
        ":hover": {
          backgroundColor: "color-mix(in srgb, var(--color-error) 86%, white)",
          borderColor: "color-mix(in srgb, var(--color-error) 86%, white)",
          boxShadow: "0 6px 0 0 var(--color-border-emphasized)",
          transform: "translateY(-1px)",
        },
        ":active": {
          backgroundColor: "color-mix(in srgb, var(--color-error) 82%, black)",
          borderColor: "color-mix(in srgb, var(--color-error) 82%, black)",
          boxShadow: "0 1px 0 0 var(--color-border-emphasized)",
          transform: "translateY(2px)",
        },
      },
    },
    "checkbox-input": {
      base: {
        borderRadius: "var(--radius-element)",
      },
    },
    "checkbox-indicator": {
      base: {
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-border-emphasized)",
        borderRadius: "8px",
        borderWidth: "2px",
        boxShadow: "0 2px 0 var(--color-border)",
      },
      checked: {
        backgroundColor: "var(--color-accent)",
        borderColor: "var(--color-accent)",
        boxShadow: "0 2px 0 var(--color-border-emphasized)",
        color: "var(--color-on-accent)",
      },
      disabled: {
        backgroundColor: "var(--color-background-muted)",
        borderColor: "var(--color-border)",
        boxShadow: "none",
      },
    },
    "checkbox-label": {
      base: {
        fontWeight: "600",
      },
    },
    "checkbox-list": {
      base: {
        borderRadius: "var(--radius-element)",
      },
    },
    "radio-list": {
      base: {
        borderRadius: "var(--radius-container)",
      },
    },
    "radio-list-item": {
      base: {
        borderColor: "transparent",
        borderRadius: "var(--radius-element)",
        borderStyle: "solid",
        borderWidth: "2px",
      },
      selected: {
        backgroundColor: "var(--color-accent-muted)",
        borderColor: "var(--color-accent)",
      },
      disabled: {
        backgroundColor: "var(--color-background-muted)",
        borderColor: "var(--color-border)",
      },
    },
    "radio-indicator": {
      base: {
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-border-emphasized)",
        borderWidth: "2px",
        boxShadow: "0 2px 0 var(--color-border)",
      },
      checked: {
        backgroundColor: "var(--color-accent)",
        borderColor: "var(--color-accent)",
        boxShadow: "0 2px 0 var(--color-border-emphasized)",
      },
      disabled: {
        backgroundColor: "var(--color-background-muted)",
        borderColor: "var(--color-border)",
        boxShadow: "none",
      },
    },
    "radio-indicator-dot": {
      base: {
        backgroundColor: "var(--color-on-accent)",
      },
    },
    switch: {
      base: {
        backgroundColor: "var(--color-background-muted)",
        borderColor: "var(--color-border-emphasized)",
        borderWidth: "2px",
      },
      checked: {
        backgroundColor: "var(--color-accent)",
        borderColor: "var(--color-accent)",
      },
      disabled: {
        backgroundColor: "var(--color-background-muted)",
        borderColor: "var(--color-border)",
      },
    },
    "switch-thumb": {
      base: {
        backgroundColor: "var(--color-background-surface)",
        boxShadow: "0 2px 0 var(--color-border)",
        borderColor: "var(--color-border-emphasized)",
        borderWidth: "2px",
      },
      checked: {
        backgroundColor: "var(--color-on-accent)",
        boxShadow: "0 2px 0 var(--color-border-emphasized)",
      },
    },
    "switch-field": {
      base: {
        borderRadius: "var(--radius-element)",
      },
    },
    "switch-label": {
      base: {
        fontWeight: "600",
      },
    },
    "text-input": {
      base: {
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-border-emphasized)",
        borderRadius: "var(--radius-full)",
        borderWidth: "2px",
        boxShadow: "0 3px 0 var(--color-border)",
        fontWeight: "500",
      },
    },
    selector: {
      base: {
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-border-emphasized)",
        borderRadius: "var(--radius-full)",
        borderWidth: "2px",
        boxShadow: "0 3px 0 var(--color-border)",
        fontWeight: "500",
      },
    },
    "selector-option": {
      base: {
        color: "var(--color-text-primary)",
      },
    },
    "selector-option-row": {
      base: {
        borderColor: "transparent",
        borderRadius: "var(--radius-inner)",
        borderStyle: "solid",
        borderWidth: "2px",
      },
      selected: {
        backgroundColor: "var(--color-accent-muted)",
        borderColor: "var(--color-accent)",
      },
      disabled: {
        backgroundColor: "var(--color-background-muted)",
      },
    },
    "selector-popup": {
      base: {
        backgroundColor: "var(--color-background-popover)",
        borderColor: "var(--color-border-emphasized)",
        borderRadius: "var(--radius-container)",
        borderWidth: "2px",
        boxShadow: "var(--shadow-med)",
      },
    },
    "selector-section-heading": {
      base: {
        color: "var(--color-text-secondary)",
        fontWeight: "600",
      },
    },
    "selector-empty-state": {
      base: {
        color: "var(--color-text-secondary)",
      },
    },
    "tab-list": {
      base: {
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-border)",
        borderRadius: "var(--radius-container)",
        borderWidth: "2px",
        boxShadow: "0 2px 0 var(--color-border)",
      },
    },
    "tab-strip": {
      base: {
        gap: "var(--spacing-1)",
        padding: "var(--spacing-1)",
      },
    },
    tab: {
      base: {
        borderRadius: "var(--radius-full)",
        color: "var(--color-text-secondary)",
        fontWeight: "600",
      },
      selected: {
        backgroundColor: "var(--color-background-card)",
        color: "var(--color-text-primary)",
        boxShadow: "0 2px 0 var(--color-border)",
      },
    },
    "tab-indicator": {
      selected: {
        backgroundColor: "var(--color-accent)",
        borderRadius: "var(--radius-full)",
      },
    },
    collapsible: {
      base: {
        backgroundColor: "var(--color-background-card)",
        borderColor: "var(--color-border)",
        borderRadius: "var(--radius-container)",
        borderWidth: "2px",
        overflow: "hidden",
      },
    },
    "collapsible-group": {
      base: {
        borderRadius: "var(--radius-container)",
      },
    },
    "collapsible-trigger": {
      base: {
        backgroundColor: "var(--color-background-card)",
        color: "var(--color-text-primary)",
        fontWeight: "700",
      },
    },
    "collapsible-content": {
      base: {
        borderTopColor: "var(--color-border)",
        borderTopStyle: "solid",
        borderTopWidth: "2px",
      },
    },
    token: {
      base: {
        borderColor: "var(--color-border-emphasized)",
        borderRadius: "var(--radius-full)",
        borderStyle: "solid",
        borderWidth: "2px",
        fontWeight: "600",
      },
    },
    badge: {
      base: {
        borderColor: "currentColor",
        borderRadius: "var(--radius-full)",
        borderStyle: "solid",
        borderWidth: "1px",
        fontWeight: "600",
      },
      "variant:warning": {
        backgroundColor: "var(--color-warning)",
        color: "var(--color-on-warning)",
      },
    },
    tooltip: {
      base: {
        backgroundColor: "var(--color-text-primary)",
        borderColor: "var(--color-accent)",
        borderRadius: "var(--radius-element)",
        borderStyle: "solid",
        borderWidth: "2px",
        boxShadow: "var(--shadow-med)",
        color: "var(--color-background-surface)",
      },
    },
    toast: {
      base: {
        backgroundColor: "var(--color-background-popover)",
        borderColor: "var(--color-accent)",
        borderRadius: "var(--radius-container)",
        borderStyle: "solid",
        borderWidth: "2px",
        boxShadow: "var(--shadow-high)",
      },
      "type:error": {
        borderColor: "var(--color-error)",
      },
    },
    skeleton: {
      base: {
        backgroundColor: "var(--color-skeleton)",
        borderRadius: "var(--radius-inner)",
      },
    },
    spinner: {
      base: {
        "--spinner-color": "var(--color-accent)",
        "--spinner-track-color": "var(--color-track)",
      },
    },
    "empty-state": {
      base: {
        backgroundColor: "var(--color-background-card)",
        borderColor: "var(--color-border)",
        borderRadius: "var(--radius-container)",
        borderStyle: "solid",
        borderWidth: "2px",
        boxShadow: "var(--shadow-low)",
      },
    },
    "empty-state-title": {
      base: {
        color: "var(--color-text-primary)",
        fontWeight: "700",
      },
    },
    "empty-state-description": {
      base: {
        color: "var(--color-text-secondary)",
      },
    },
    "field-status": {
      base: {
        borderRadius: "var(--radius-element)",
        borderStyle: "solid",
        borderWidth: "2px",
      },
      "type:error": {
        backgroundColor: "var(--color-error-muted)",
        borderColor: "var(--color-error)",
        color: "var(--color-text-red)",
      },
      "type:warning": {
        backgroundColor: "var(--color-warning-muted)",
        borderColor: "var(--color-warning)",
        color: "var(--color-text-yellow)",
      },
      "type:success": {
        backgroundColor: "var(--color-success-muted)",
        borderColor: "var(--color-success)",
        color: "var(--color-text-green)",
      },
    },
    divider: {
      base: {
        color: "var(--color-border-emphasized)",
      },
    },
    dialog: {
      base: {
        backgroundColor: "var(--color-background-popover)",
        borderColor: "var(--color-border-emphasized)",
        borderRadius: "var(--radius-container)",
        borderStyle: "solid",
        borderWidth: "2px",
        boxShadow: "var(--shadow-high)",
      },
    },
    carousel: {
      base: {
        backgroundColor: "var(--color-background-card)",
        borderColor: "var(--color-border)",
        borderRadius: "var(--radius-container)",
        borderStyle: "solid",
        borderWidth: "2px",
        boxShadow: "0 2px 0 var(--color-border)",
      },
    },
    "carousel-scroller": {
      base: {
        scrollPaddingBlock: "var(--spacing-2)",
      },
    },
    "form-layout": {
      base: {
        borderRadius: "var(--radius-container)",
      },
    },
    field: {
      base: {
        borderRadius: "var(--radius-element)",
      },
    },
    "field-label": {
      base: {
        fontWeight: "600",
      },
    },
    slider: {
      base: {
        color: "var(--color-accent)",
      },
    },
    "slider-track": {
      base: {
        backgroundColor: "var(--color-background-muted)",
        borderColor: "var(--color-border)",
        borderRadius: "var(--radius-full)",
        borderStyle: "solid",
        borderWidth: "2px",
      },
    },
    "slider-thumb": {
      base: {
        backgroundColor: "var(--color-accent)",
        borderColor: "var(--color-accent)",
        borderStyle: "solid",
        borderWidth: "2px",
        boxShadow: "0 2px 0 var(--color-border-emphasized)",
      },
    },
    "date-input": {
      base: {
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-border-emphasized)",
        borderRadius: "var(--radius-full)",
        borderWidth: "2px",
        boxShadow: "0 3px 0 var(--color-border)",
        fontWeight: "500",
      },
    },
    "date-input-toggle-icon": {
      base: {
        color: "var(--color-icon-accent)",
      },
    },
    "time-input": {
      base: {
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-border-emphasized)",
        borderRadius: "var(--radius-full)",
        borderWidth: "2px",
        boxShadow: "0 3px 0 var(--color-border)",
        fontWeight: "500",
      },
    },
    timestamp: {
      base: {
        fontWeight: "600",
      },
    },
    table: {
      base: {
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-border)",
        borderRadius: "var(--radius-container)",
        borderStyle: "solid",
        borderWidth: "2px",
        overflow: "hidden",
      },
    },
    "table-header": {
      base: {
        backgroundColor: "var(--color-background-muted)",
      },
    },
    "table-header-cell": {
      base: {
        color: "var(--color-text-primary)",
        fontWeight: "700",
      },
    },
    "table-cell": {
      base: {
        color: "var(--color-text-primary)",
      },
    },
    pagination: {
      base: {
        borderRadius: "var(--radius-full)",
      },
    },
    "pagination-dot": {
      base: {
        backgroundColor: "var(--color-background-muted)",
        borderColor: "var(--color-border)",
        borderStyle: "solid",
        borderWidth: "2px",
      },
    },
    "file-input": {
      base: {
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-border-emphasized)",
        borderRadius: "var(--radius-container)",
        borderStyle: "solid",
        borderWidth: "2px",
      },
      "mode:dropzone": {
        backgroundColor: "var(--color-background-muted)",
        borderColor: "var(--color-accent)",
        borderStyle: "dashed",
      },
    },
    thumbnail: {
      base: {
        backgroundColor: "var(--color-background-muted)",
        borderColor: "var(--color-border-emphasized)",
        borderRadius: "var(--radius-element)",
        borderStyle: "solid",
        borderWidth: "2px",
      },
    },
    lightbox: {
      base: {
        backgroundColor: "var(--color-overlay)",
        color: "var(--color-on-dark)",
      },
    },
    "bottom-sheet": {
      base: {
        backgroundColor: "var(--color-background-popover)",
        borderColor: "var(--color-border-emphasized)",
        borderRadius: "var(--radius-page)",
        borderStyle: "solid",
        borderWidth: "2px",
        boxShadow: "var(--shadow-high)",
      },
    },
    code: {
      base: {
        backgroundColor: "var(--color-background-muted)",
        borderRadius: "var(--radius-inner)",
      },
    },
    "code-block": {
      base: {
        backgroundColor: "var(--color-background-card)",
        borderColor: "var(--color-border)",
        borderRadius: "var(--radius-container)",
        borderStyle: "solid",
        borderWidth: "2px",
        boxShadow: "var(--shadow-low)",
      },
    },
    "code-block-header": {
      base: {
        backgroundColor: "var(--color-background-muted)",
      },
    },
    "code-block-title": {
      base: {
        color: "var(--color-text-primary)",
        fontWeight: "700",
      },
    },
    "code-block-copy-button": {
      base: {
        color: "var(--color-text-accent)",
      },
    },
    card: {
      base: {
        borderColor: "var(--color-border)",
        borderRadius: "var(--radius-container)",
        borderWidth: "2px",
        boxShadow: "var(--shadow-low)",
      },
    },
    "progress-bar-track": {
      base: {
        backgroundColor: "var(--color-background-muted)",
        borderColor: "var(--color-border-emphasized)",
        borderRadius: "var(--radius-full)",
        borderStyle: "solid",
        borderWidth: "2px",
        boxSizing: "border-box",
        height: "16px",
      },
    },
    "progress-bar-fill": {
      "variant:accent": {
        backgroundColor: "var(--color-accent)",
      },
      "variant:success": {
        backgroundColor: "var(--color-success)",
      },
      "variant:warning": {
        backgroundColor: "var(--color-warning)",
      },
      "variant:error": {
        backgroundColor: "var(--color-error)",
      },
    },
  },
});
