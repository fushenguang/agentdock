/**
 * Settings icons this package registers under its own namespace.
 *
 * Astryx's built-in `IconName` set has no palette/globe glyph, and the hard rule is "no icon
 * dependency" — so the extension seam `registerIcons` is used with namespaced keys (`appdock:*`),
 * exactly as the icon set intends. Registration is a module-level side effect, so simply importing
 * this module (directly or through the settings board) makes the keys resolvable on the server and
 * the client alike. The glyphs are 24×24 line strokes painted with `currentColor`, so size and color
 * stay owned by `<Icon size color>` and width/height/stroke are intentionally not set here.
 */
import { registerIcons } from "@astryxdesign/core/Icon";
import type { ReactNode, SVGProps } from "react";

type GlyphProps = SVGProps<SVGSVGElement>;

function glyph(children: ReactNode) {
  return function Glyph(props: GlyphProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    );
  };
}

/** Appearance — a palette. */
const Appearance = glyph(
  <>
    <path d="M12 3a9 9 0 1 0 0 18h1.4a2 2 0 0 0 0-4H13a1.5 1.5 0 0 1 0-3h3.6A3.4 3.4 0 0 0 20 10.6C20 6.4 16.4 3 12 3Z" />
    <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none" />
    <circle cx="15.4" cy="10.2" r="1" fill="currentColor" stroke="none" />
  </>,
);

/** Language — a globe. */
const Language = glyph(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5Z" />
  </>,
);

export const SETTINGS_ICONS = {
  "appdock:appearance": <Appearance />,
  "appdock:language": <Language />,
} as const;

export type SettingsIconName = keyof typeof SETTINGS_ICONS;

registerIcons(SETTINGS_ICONS);
