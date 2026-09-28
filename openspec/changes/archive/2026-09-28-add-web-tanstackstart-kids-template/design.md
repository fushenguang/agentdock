## Context

See `proposal.md` for motivation. This design responds to three sets of constraints.

### Current AgentDock substrate

`web-tanstackstart` already provides the right platform foundation: TanStack Start, React 19, TypeScript 7, Vite 8, Astryx 0.6, StyleX, Drizzle SQLite/Supabase, locale-prefixed routes, a first-party appearance cookie, SSR-safe prebuilt themes, and a full local verification command. Its theme registry is a clean extension point, but its information architecture, density, copy, and interaction defaults target enterprise/internal applications.

The new template should reuse the platform substrate without turning the enterprise template into a collection of child-mode branches.

### Astryx guidance

The Astryx documentation establishes the non-negotiable integration rules:

- Components come before raw HTML primitives.
- Semantic tokens come before hard-coded color, spacing, radius, shadow, and type values.
- Application code stays theme-agnostic; feature components do not branch on theme names.
- Custom production themes are generated with `astryx theme build` so component overrides exist in static CSS during SSR.
- StyleX `xstyle` is the preferred local override path for component-specific styling; `className` is for external CSS or Tailwind integration.
- Motion uses duration/easing tokens and honors `prefers-reduced-motion`.
- Illustrations are purposeful, consistent, simple, sized approximately 120–240px, and paired with explanatory text.
- Navigation, layout, and form behavior use Astryx primitives such as `AppShell`, `Layout`, `Stack`, `Grid`, `Section`, `Card`, `Heading`, `Text`, `Button`, `TextInput`, `Selector`, `Switch`, `Dialog`, `EmptyState`, and the accessibility hooks.
- Astryx's accessibility behavior is authoritative. Swizzling or copying component source is not needed for the visual redesign and would create a maintenance fork.

### animal-island-ui research findings

The local reference clone used for this design is `~/.codex/references/animal-island-ui` at commit `29051196bd7586d4484b55431b03178e6046fa64` (`v2.0.0`).

The project contributes several strong ideas worth adapting:

- A coherent visual identity with explicit, testable rules instead of an arbitrary collection of cute colors.
- Warm earth-neutral surfaces, rounded geometry, and a restrained use of 3D depth for primary actions only.
- A dual token approach: build-time values for authored component computations and runtime CSS custom properties for consumer theming.
- Explicit loading, empty, error, success, overlay, and reduced-motion states rather than treating them as edge cases.
- A design-system document, component specifications, and an installable Agent Skill that keep generated work aligned.
- An axe-core accessibility smoke layer and a docs-sync gate that prevent obvious contract gaps.

The project also exposes risks that the new template must not inherit:

- Its history includes a real Nintendo DMCA complaint and a full asset/history remediation. The current repository is clean and MIT-licensed, but AgentDock should not copy historical assets or rely on the project as a runtime source.
- The library is a separate light-oriented component system. Its packaged CSS contains many hard-coded colors and no complete dark-mode contract, so token overrides alone cannot adapt every component.
- Global CSS behavior has previously caused consumer regressions, including a cursor override that affected host-page links; that was fixed, but it demonstrates why the child template should not introduce a second global component stylesheet.
- Earlier releases shipped very large CSS/JS and font payloads, and tree-shaking was a reported issue. The current package has improved module preservation, but the asset budget remains a clear warning for a child template.
- Issues and PRs show lifecycle/state bugs in overlays, notifications, uploads, countdowns, selection positioning, and loading states. These are solvable, but they are exactly the classes of interaction behavior Astryx already owns and tests.
- The maintainer rejected a Tailwind + Radix rewrite and the project accepts only a small dependency surface. That reinforces the value of keeping Astryx and StyleX as the platform kernel instead of adding a second design-system dependency.
- Documentation drift is a recurring maintenance burden. The child template needs machine-checked docs and generated-theme freshness checks.

The adopted conclusion is therefore: learn from the design language and quality practices, not from the project's implementation or assets.

## Goals / Non-Goals

**Goals:**

- Create a standalone child-oriented TanStack Start template that is useful as a product starting point, not merely a themed enterprise dashboard.
- Express a warm, safe, encouraging, playful, and calming visual identity through original tokens and assets.
- Support developmentally meaningful age profiles with configurable visual, interaction, content, and feedback capabilities.
- Preserve Astryx as the component, focus, keyboard, ARIA, SSR, and theme kernel.
- Make the child experience server-resolved and flash-free in SSR.
- Make accessibility, reduced motion, multimodal support, privacy, and safe interaction defaults part of the template contract.
- Keep the template extensible by product teams without requiring them to modify Astryx core.
- Give agents enough explicit guidance to extend the template without reintroducing an adult enterprise pattern.

**Non-Goals:**

- Recreating the DOM, CSS, props, assets, or interaction bugs of `animal-island-ui`.
- Shipping a second global component library or a second CSS-in-JS runtime.
- Treating age as a single theme name or a raw numeric branch inside feature components.
- Defining child identity, account, parental-consent, payment, analytics, or backend profile systems.
- Making legal claims about age suitability, developmental outcomes, or regulatory compliance.
- Supporting every possible age model in the first release. The profile model must be extensible, but the template ships a focused initial set.

## Decisions

### D1: Add a dedicated `web-tanstackstart-kids` template

Create a sibling template rather than adding child branches to `web-tanstackstart`.

Rationale:

- The child template needs a different information architecture, density, navigation contract, content tone, safety policy, and verification matrix.
- A sibling template keeps the enterprise template stable and makes the child experience independently testable and discoverable through the CLI.
- The two templates can share implementation patterns and platform decisions without forcing every enterprise user to carry child-only code.

Alternative rejected: add a `kids` theme and a few conditional wrappers to `web-tanstackstart`. It would create persistent branching, documentation ambiguity, and an unclear product identity.

### D2: Separate the visual theme axis from the developmental profile axis

Use two cooperating contracts:

```text
kids theme family
  color, type, shape, elevation, motion, illustration tone

kid experience profile
  target size, density, choice count, navigation depth,
  reading support, audio default, confirmation policy,
  feedback intensity, timeout policy
```

The theme decides how the product looks. The profile decides how much support, information, and autonomy the child receives.

Alternative rejected: encode each age as only a theme. That cannot change target sizes, choice counts, reading mode, confirmation policy, or content length in a semantic way.

### D3: Ship three initial profiles backed by a capability model

The initial presets are:

| Profile    | Intended age | Default posture                                                                                                                      |
| ---------- | -----------: | ------------------------------------------------------------------------------------------------------------------------------------ |
| `sprout`   |          3–5 | Very large targets, very low density, audio-first guidance, 1-level navigation, strong encouragement, strict confirmation            |
| `explorer` |          6–8 | Large targets, low density, mix of audio/text/icon guidance, 2-level navigation, guided exploration, confirmation plus undo          |
| `creator`  |         9–12 | Comfortable targets, moderate density, text-first with optional audio, up to 3 navigation levels, more autonomy, undo-first recovery |

The capability contract is more important than the labels. Each profile resolves to:

| Capability            | Sprout                | Explorer               | Creator                     |
| --------------------- | --------------------- | ---------------------- | --------------------------- |
| Minimum target        | 56px                  | 48px                   | 44px                        |
| Base text size        | 20px                  | 18px                   | 16px                        |
| Density               | airy                  | comfortable            | focused                     |
| Max primary choices   | 3                     | 5                      | 7                           |
| Navigation depth      | 1                     | 2                      | 3                           |
| Reading support       | audio-first           | mixed                  | text-first, audio on demand |
| Motion level          | gentle                | playful                | standard                    |
| Illustration emphasis | high                  | medium                 | low to medium               |
| Guidance              | always available      | contextual             | on demand                   |
| Destructive action    | explicit confirmation | confirmation plus undo | undo preferred              |
| Timeout               | disabled by default   | extended               | standard where non-harmful  |

Product teams can override individual capabilities without creating a new hard-coded age branch.

Alternative rejected: use a precise age number as the primary runtime input. It increases privacy risk and creates false precision because reading level, motor control, language proficiency, and sensory needs do not map perfectly to age.

### D4: Build a child theme family with Astryx prebuilt artifacts

Create a shared Astryx theme source for the child visual language and generate profile-aware built artifacts:

```text
kidsBase
  ├─ kids-sprout
  ├─ kids-explorer
  └─ kids-creator
```

The exact split can be implemented as one source family extending a base theme, but the runtime result must use prebuilt Astryx JavaScript and CSS. No runtime `<style>` injection is allowed for production child themes.

The theme should establish:

- Warm cream and soft paper surfaces instead of cold gray.
- Original sunny accent colors with semantic roles, not a palette copied from a third-party game.
- Deep warm text colors with verified contrast instead of pure black or washed-out brown.
- Rounded, calm geometry; pill controls only where semantics justify them.
- 3D depth only for primary/large action affordances; cards use borders, spacing, and low elevation.
- Larger type ramps and line heights for early profiles.
- Gentle duration/easing tokens and a fully reduced-motion path.
- A warm dusk dark mode rather than a stark black mode.
- Original decorative shapes and illustrations in SVG/CSS, with no historical or character-derived assets.

Alternative rejected: override arbitrary Astryx component colors with broad global CSS. It would bypass the theme contract, make dark mode unreliable, and create unmanaged specificity.

### D5: Put the profile resolver at the application boundary

The template should expose a `ChildExperienceProvider` around the Astryx `Theme` provider. The provider resolves a profile to:

- an Astryx built theme;
- a capability object;
- document-level data attributes such as `data-kid-profile` and `data-kid-reading-mode`;
- optional product overrides.

Server rendering resolves the same profile as the client. For the template demonstration, the profile can be persisted in a first-party cookie using the same SSR pattern as the existing appearance preference. It must remain a coarse profile value, not a birth date. A consuming product may supply a different server-side resolver without changing feature components.

Feature components consume semantic capabilities or shared child wrappers. They do not branch on `sprout`, `explorer`, `creator`, or a numeric age directly.

Alternative rejected: a client-only React context initialized in `useEffect`. That would create a visible profile/theme flash and violate the existing SSR contract.

### D6: Keep child wrapper components semantic and thin

The template should add first-party components only where repeated child semantics exist:

- `KidShell`: composes `AppShell`, navigation, current profile, and the product content frame.
- `KidPageHeader`: child-oriented heading, guidance, and primary-action placement using Astryx `Heading`, `Text`, and `Button`.
- `KidActionCard`: a large, clearly interactive unit built on Astryx `Card`/`ClickableCard` semantics.
- `KidChoice`: a choice control composed from Astryx-supported controls, with target size and guidance from the active profile.
- `KidProgress`: progress and encouragement without gambling-like or streak-pressure behavior.
- `KidState`: shared loading, empty, waiting, error, and success presentation with illustrations and localized text.
- `KidReadAlong`: optional audio/caption support for text-heavy activities.
- `GuardianGate`: an explicit confirmation boundary for external, sensitive, or consequential actions.
- `KidProfileSwitcher`: development/demo tooling for previewing age profiles; not a child-facing gameplay control.

Each wrapper must delegate behavior to Astryx and add only child-specific layout, copy slots, policy, or presentation. A wrapper that would need to reimplement focus management, selection, dialogs, validation, or keyboard behavior is not allowed.

Alternative rejected: a full child component library parallel to Astryx. It would duplicate behavior, accessibility, and maintenance responsibility.

### D7: Make interaction policy data-driven and testable

The experience layer should expose deterministic policy values rather than scattered constants:

```ts
interface ChildCapabilities {
  minTargetSize: number
  density: 'airy' | 'comfortable' | 'focused'
  maxPrimaryChoices: number
  navigationDepth: number
  readingSupport: 'audio-first' | 'mixed' | 'text-first'
  motion: 'gentle' | 'playful' | 'standard'
  guidance: 'always' | 'contextual' | 'on-demand'
  confirmation: 'explicit' | 'confirm-or-undo' | 'undo-first'
  timeoutPolicy: 'disabled' | 'extended' | 'standard'
}
```

The exact type and storage names are implementation details, but the semantics are required. Tests can render the same template page under each profile and assert externally visible behavior.

Alternative rejected: age-specific CSS plus ad hoc React checks. It hides policy in two places, cannot be tested coherently, and encourages raw age branching.

### D8: Treat content, feedback, and safety as first-class system layers

The template must provide shared patterns for:

- short, concrete, encouraging copy;
- icon plus text for primary actions;
- clear success, waiting, empty, error, and recovery states;
- non-blaming error language;
- optional read-aloud and captions;
- reversible or explicitly confirmed destructive actions;
- no shame, fear, urgency, public comparison, or infinite reward loops;
- guardian gates for external links, purchases, sensitive information, and settings that affect the child;
- default absence of advertising, third-party behavioral tracking, social feeds, and public child profiles.

Alternative rejected: leave safety and tone to product teams. A template that presents a child-friendly visual shell but defaults to enterprise retention mechanics would be actively misleading.

### D9: Use original visual assets and explicit provenance

The template should use original SVG/CSS illustrations or assets already owned by AgentDock. If an external font, icon, illustration, or animation is used, its source, license, bundle impact, contrast behavior, and accessibility semantics must be recorded. The template should use Astryx theme icon overrides where semantic icons are needed rather than importing a second icon registry.

For the first release, a reasonable implementation is:

- `Nunito` variable font for Latin rounded typography, self-hosted through an open-source package or first-party asset pipeline.
- `Noto Sans SC` variable font for Simplified Chinese coverage, subset and loaded with a metric-compatible system fallback.
- Original SVG/CSS illustrations only; no screenshots or character assets from the reference project.

The exact font package can change without changing the design contract, but the asset budget and license record are required.

Alternative rejected: copy the font or illustration files from `animal-island-ui`. Even where licenses permit redistribution, coupling the template to that provenance is unnecessary and creates avoidable trust and maintenance risk.

### D10: Verify the child experience as a matrix

The verification matrix should cover:

- profiles: `sprout`, `explorer`, `creator`;
- locales: `zh-CN`, `en`;
- modes: light, dark/dusk, system;
- viewports: 320px, tablet, desktop;
- input: keyboard and touch-sized hit targets;
- preferences: reduced motion, high contrast where supported, audio disabled;
- states: loading, empty, waiting, error, success, progress, guardian gate.

The verification stack should include:

- Astryx theme build freshness (`astryx theme build --check` or equivalent);
- TypeScript, lint, format, unit, and build gates;
- profile-resolution tests;
- SSR/hydration checks;
- accessibility automation plus targeted manual keyboard checks;
- visual regression snapshots for the profile/locale/viewport matrix;
- copy and asset provenance checks;
- bundle-size and font-loading checks.

Alternative rejected: manual visual review only. The differentiator of this template is age-sensitive behavior; a single screenshot cannot verify that contract.

### D11: Share patterns, not a runtime fork of `web-tanstackstart`

The child template should start from the same platform conventions and copy only what is necessary to be standalone or workspace-member compatible. It must not import the enterprise template at runtime or create a hidden dependency between generated projects.

Reasoning:

- AgentDock templates are scaffold outputs, not shared runtime packages.
- A shared runtime package would be a larger platform refactor with migration risk.
- Keeping the same conventions and verification gates makes drift visible while preserving independent generation.

Alternative rejected: turn the common substrate into a new package in this change. It is valuable, but it expands the change into a platform refactor and is not required to deliver the child template.

## Risks / Trade-offs

- [Visual style may become an “enterprise UI with cute colors”] → Treat information architecture, copy, target size, feedback, and interaction policy as part of the design, not only theme work.
- [Three age profiles may not fit every product] → Make profile presets and capability overrides data-driven; keep the initial presets explicit and testable.
- [Older children may find the UI infantilizing] → Use the Creator profile to reduce illustration density, increase autonomy, and shift toward text-first guidance.
- [Youth privacy can be harmed by precise age storage] → Persist only coarse bands by default; require a product-specific privacy review before storing exact age or birth date.
- [Cute colors can fail contrast] → Validate every semantic color pair in light and dusk modes; do not treat pastel values as automatically accessible.
- [Motion can cause sensory discomfort] → Use gentle motion presets, reduced-motion behavior, and no animation that blocks the next action.
- [A second template may drift from platform fixes] → Reuse `web-tanstackstart` conventions and verification gates; document intentional divergence.
- [Original illustrations and fonts can expand scope] → Start with a small, coherent illustration set and a strict asset budget; add assets through versioned first-party components.
- [SSR hydration can flash the wrong profile] → Resolve profile and theme before first render and add an explicit SSR/hydration test.
- [Component wrappers can silently weaken Astryx accessibility] → Require wrapper tests for semantics, labels, focus, disabled state, and keyboard behavior.
- [Child safety requirements can be mistaken for legal compliance] → Document the template as a starting policy baseline, not a certification; require product-specific review for regulated contexts.

## Migration Plan

1. Create the sibling template scaffold from the established `web-tanstackstart` conventions, including standalone and workspace-member metadata.
2. Add the child theme source, build it into prebuilt Astryx artifacts, and wire the theme CSS into the application layer order.
3. Add the child profile/capability model and SSR-safe provider, including a coarse profile cookie or equivalent resolver.
4. Build the child shell and the initial semantic wrappers on top of Astryx primitives.
5. Add child-facing pages, localized content examples, state components, illustrations, and guardian-gate examples.
6. Add agent documentation, design guidance, provenance records, and extension recipes.
7. Add the verification matrix and make the child template part of the generated registry and docs.
8. Run the full platform gates, template gates, accessibility checks, visual checks, and a manual preview at each profile/locale/mode before release.

Rollback is limited to removing the new template and its registry/docs entries before publication. The existing `web-tanstackstart` and enterprise applications are not migrated or modified by this change.
