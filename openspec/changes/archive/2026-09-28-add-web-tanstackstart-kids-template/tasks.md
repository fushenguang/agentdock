## 1. Template Scaffold And Guardrails

- [x] 1.1 Create `templates/web-tanstackstart-kids/` from the established `web-tanstackstart` conventions without modifying the enterprise template.
- [x] 1.2 Configure package metadata, standalone files, workspace-member behavior, template description, and AgentDock minimum CLI metadata.
- [x] 1.3 Add template-local `AGENTS.md`, `LLM.md`, and `DESIGN.md` with the Astryx kernel boundary and child experience rules.
- [x] 1.4 Add a provenance record for the `animal-island-ui` reference, including commit, license, DMCA remediation context, adopted ideas, and rejected implementation details.
- [x] 1.5 Add or update scripts for theme generation/checking, unit tests, accessibility tests, visual tests, and the full template acceptance command.

## 2. Child Theme And Visual Foundation

- [x] 2.1 Define the first-party child visual token contract for color, typography, shape, border, elevation, motion, and illustration usage.
- [x] 2.2 Implement the shared child Astryx theme source with original warm, sunny, safe, and encouraging token values for light and dusk modes.
- [x] 2.3 Implement the `sprout`, `explorer`, and `creator` theme variants through the shared Astryx theme family.
- [x] 2.4 Generate the prebuilt Astryx theme JavaScript and CSS and import the CSS in the required layer order.
- [x] 2.5 Add the checked-in theme freshness command using the Astryx CLI and wire it into the template acceptance gate.
- [x] 2.6 Add self-hosted rounded Latin and Simplified Chinese font loading with real fallbacks and document the asset/license record.
- [x] 2.7 Add theme icon overrides only where semantic Astryx names need child-friendly original glyphs.
- [x] 2.8 Add automated contrast checks for light and dusk semantic color pairs.
- [x] 2.9 Verify theme switching, first paint, and no runtime theme injection in production.

## 3. Age Profile And Capability Engine

- [x] 3.1 Define typed `AgeBand`, `ChildCapabilities`, profile preset, and capability override contracts.
- [x] 3.2 Implement deterministic capability resolution for `sprout`, `explorer`, and `creator`, including product-supplied overrides.
- [x] 3.3 Implement `ChildExperienceProvider` around the active Astryx `Theme` provider without forking Astryx behavior.
- [x] 3.4 Implement SSR-safe initial profile resolution using a coarse-profile cookie or equivalent product resolver.
- [x] 3.5 Persist and validate only coarse profile data; reject or ignore precise birth-date fields.
- [x] 3.6 Set document-level profile and reading-mode data attributes for CSS and product integration without exposing raw age.
- [x] 3.7 Add profile resolution unit tests, invalid-value fallback tests, and override-precedence tests.
- [x] 3.8 Add SSR/hydration tests proving that profile, theme, and capabilities match across server and client.
- [x] 3.9 Add a guard or review test that prevents feature components from branching on raw age values or profile-label strings.

## 4. Shell And Child-Facing Components

- [x] 4.1 Implement `KidShell` with Astryx `AppShell`, age-appropriate navigation, profile controls for demonstration, and locale-safe links.
- [x] 4.2 Implement `KidPageHeader` using Astryx `Heading`, `Text`, and `Button` with guidance and one-primary-action rules.
- [x] 4.3 Implement `KidActionCard` on top of Astryx `Card` or `ClickableCard` semantics with large, consistent affordances.
- [x] 4.4 Implement `KidChoice` using Astryx-supported controls and profile-driven target size, choice count, and guidance.
- [x] 4.5 Implement `KidProgress` with effort-oriented progress, no streak pressure, and reduced-motion support.
- [x] 4.6 Implement `KidState` for loading, empty, waiting, error, success, and recovery states with localized copy and illustration slots.
- [x] 4.7 Create the first-party original illustration primitives and assets used by onboarding, empty, error, success, and activity states.
- [x] 4.8 Implement `KidReadAlong` with optional read-aloud, caption/transcript fallback, and no autoplay by default.
- [x] 4.9 Implement `GuardianGate` for external, sensitive, or consequential actions.
- [x] 4.10 Implement the development/demo profile switcher without exposing it as a child-facing primary control.
- [x] 4.11 Add component tests for semantics, labels, focus, disabled state, target size, and keyboard operation.

## 5. Template Information Architecture And Content

- [x] 5.1 Define the child-oriented route and navigation structure under the locale-prefixed application shell.
- [x] 5.2 Build a welcome/onboarding example that explains the application in short, concrete language and supports age-appropriate guidance.
- [x] 5.3 Build a general activity-hub example that demonstrates the child visual language and profile adaptation without selecting a specific education domain.
- [x] 5.4 Build a multi-step activity example that demonstrates one primary action, progress, waiting, cancellation, and recovery.
- [x] 5.5 Build completion and encouragement states that celebrate effort without manipulative engagement.
- [x] 5.6 Build empty, error, offline, and permission examples using `KidState`.
- [x] 5.7 Build a safe settings or guardian-boundary example that demonstrates the `GuardianGate` pattern.
- [x] 5.8 Add all child-facing copy to every supported locale catalog and keep key parity.
- [x] 5.9 Add age- and locale-specific layout tests at 320px, tablet, and desktop widths.
- [x] 5.10 Review the example flows for simple navigation, low choice count, non-blaming errors, and absence of dark patterns.

## 6. Privacy, Safety, And Ethics Defaults

- [x] 6.1 Ensure the generated template has no advertising, third-party behavioral tracking, social feed, or public child profile by default.
- [x] 6.2 Ensure profile persistence contains only a coarse age band or equivalent capability input.
- [x] 6.3 Ensure external links, purchases, sensitive-data requests, and consequential settings can route through the guardian boundary.
- [x] 6.4 Add an automated asset provenance check for fonts, icons, illustrations, and copied code.
- [x] 6.5 Add documentation describing privacy, safety, accessibility, and engagement limits as a product baseline rather than a legal certification.
- [x] 6.6 Add a manual review checklist for product teams that add analytics, social features, or personalization.

## 7. Verification And Quality Gates

- [x] 7.1 Add axe/accessibility tests for each supported profile, locale, mode, and representative state.
- [x] 7.2 Add reduced-motion tests for components and example pages.
- [x] 7.3 Add visual-regression coverage for profile, locale, viewport, and light/dusk combinations.
- [x] 7.4 Add tests for audio-disabled, keyboard-only, screen-reader labels, and high-contrast behavior where supported.
- [x] 7.5 Add bundle-size and font-loading budgets and fail the gate when the template exceeds them without an explicit waiver.
- [x] 7.6 Verify no `animal-island-ui`, `naive-icons`, or historical third-party asset enters the production dependency graph.
- [x] 7.7 Verify that Astryx source is not swizzled, patched, or copied and that wrappers preserve component behavior.
- [x] 7.8 Run `pnpm install`, `pnpm check-types`, `pnpm build`, `pnpm format`, `pnpm test`, `pnpm lint`, and the template-specific acceptance command.
- [x] 7.9 Run the full manual preview matrix and record approval evidence before release.

## 8. Documentation, Registry, And Agent Assets

- [x] 8.1 Update the generated template registry metadata and verify the CLI can list and scaffold the new template.
- [x] 8.2 Add Chinese and English template documentation under `apps/docs` covering setup, age profiles, theming, components, safety, and extension.
- [x] 8.3 Add template README and agent guidance for adding a page, component, age capability, locale, illustration, or theme token.
- [x] 8.4 Add a maintained provenance/reference document that explains what was learned from `animal-island-ui` and what must not be copied.
- [x] 8.5 Add documentation parity checks for the new template guides.
- [x] 8.6 Update changelog or release notes according to the repository workflow.
- [x] 8.7 Run `openspec validate add-web-tanstackstart-kids-template` and resolve every validation error before marking implementation complete.
