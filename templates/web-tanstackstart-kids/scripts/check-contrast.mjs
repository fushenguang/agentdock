import { pathToFileURL } from "node:url";
import { join } from "node:path";

const root = process.cwd();
const themeRoot = join(root, "src", "components", "appearance", "themes");
const ages = ["sprout", "explorer", "creator"];
const pairs = [
  ["--color-background-body", "--color-text-primary", 4.5],
  ["--color-background-body", "--color-text-secondary", 4.5],
  ["--color-background-surface", "--color-text-primary", 4.5],
  ["--color-background-surface", "--color-text-secondary", 4.5],
  ["--color-background-card", "--color-text-primary", 4.5],
  ["--color-background-card", "--color-text-secondary", 4.5],
  ["--color-accent", "--color-on-accent", 4.5],
  ["--color-success", "--color-on-success", 4.5],
  ["--color-warning", "--color-on-warning", 4.5],
  ["--color-error", "--color-on-error", 4.5],
];
const failures = [];

function parsePair(value) {
  const match = /^light-dark\(([^,]+),\s*([^)]+)\)$/.exec(value);
  if (!match) return null;
  return [match[1].trim(), match[2].trim()];
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => character + character)
          .join("")
      : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [0, 2, 4].map((index) => Number.parseInt(full.slice(index, index + 2), 16));
}

function relativeLuminance(rgb) {
  return rgb
    .map((channel) => channel / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(foreground, background) {
  const foregroundRgb = hexToRgb(foreground);
  const backgroundRgb = hexToRgb(background);
  if (!foregroundRgb || !backgroundRgb) return null;
  const foregroundLuminance = relativeLuminance(foregroundRgb);
  const backgroundLuminance = relativeLuminance(backgroundRgb);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

for (const age of ages) {
  const themeUrl = pathToFileURL(join(themeRoot, `kids-${age}.js`)).href;
  const module = await import(themeUrl);
  const theme = module[`kids${age[0].toUpperCase()}${age.slice(1)}Theme`];

  for (const [backgroundToken, foregroundToken, minimum] of pairs) {
    const backgroundValues = parsePair(theme.tokens[backgroundToken]);
    const foregroundValues = parsePair(theme.tokens[foregroundToken]);
    if (!backgroundValues || !foregroundValues) {
      failures.push(`${age} could not resolve ${backgroundToken} / ${foregroundToken}`);
      continue;
    }

    for (const modeIndex of [0, 1]) {
      const ratio = contrastRatio(foregroundValues[modeIndex], backgroundValues[modeIndex]);
      if (ratio === null) {
        failures.push(
          `${age} ${modeIndex === 0 ? "light" : "dark"} could not calculate contrast for ${foregroundToken} on ${backgroundToken}`,
        );
        continue;
      }
      if (ratio < minimum) {
        failures.push(
          `${age} ${modeIndex === 0 ? "light" : "dark"} ${foregroundToken} on ${backgroundToken}: ${ratio.toFixed(2)} < ${minimum}`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Contrast check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Contrast check passed for all child themes.");
