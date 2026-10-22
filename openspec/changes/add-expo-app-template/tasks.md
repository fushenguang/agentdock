# Tasks: add-expo-app-template

## 1. Template foundation

- [x] 1.1 Add the Expo SDK 57, Expo Router, NativeWind, and TypeScript template configuration.
- [x] 1.2 Add source-owned reusables primitives and the visual token baseline.
- [x] 1.3 Add the two-entry WorkspaceShell, left drawer, search overlay, and two primary surfaces.
- [x] 1.4 Add `/user/**` secondary routes for profile, privacy, storage, sync, notifications, and about.
- [x] 1.5 Add the persistent voice orb, `@expo/ui` BottomSheet, snap points, status strip, collapsed
      process drawer, and result canvas.

## 2. Agent Core Lite and data

- [x] 2.1 Add typed turn, context, memory projection, tool, permission, and audit boundaries.
- [x] 2.2 Add the structured-output gate with deterministic repair, targeted retry, and explicit exhaustion.
- [x] 2.3 Add SQLite migrations plus session/event/memory/outbox repository contracts.
- [x] 2.4 Add the OpenUI renderer adapter and document the Expo 57 compatibility result.
- [x] 2.5 Add machine-readable agent route/action/test-id surfaces.

## 3. AgentDock integration

- [x] 3.1 Register the template and its standalone SQLite metadata.
- [x] 3.2 Add registry and scaffold tests for metadata, routes, agent surfaces, placeholder rewriting,
      and dependency versions.
- [x] 3.3 Add bilingual documentation and template index entries.
- [x] 3.4 Add an AgentDock CLI minor changeset.

## 4. Verification

- [x] 4.1 Run template `pnpm install`, `expo install --check`, and TypeScript checks.
- [x] 4.2 Run CLI tests and repo build/type/lint/format gates.
- [x] 4.3 Run OpenSpec, alignment, architecture, changeset, secrets, and docs parity checks.
- [x] 4.4 Record any OpenUI/Expo 57 incompatibility as an explicit adapter decision rather than a silent
      dependency downgrade.

## 5. Developer-experience and provider hardening

- [x] 5.1 Add injectable environment, transport, timeout, and cancellation seams to the
      OpenAI-compatible driver while preserving the structured-output gate boundary.
- [x] 5.2 Surface actionable structured-output issues and provider identity in the agent panel, and
      preserve the selected history session title during continuation.
- [x] 5.3 Refresh generated and platform documentation for the real provider workflow, reference
      fallback, release guard, and proxy boundary in English and Simplified Chinese.
- [x] 5.4 Add focused repository tests for endpoint normalization, request construction, response
      extraction, credential handling, and injectable transport.
- [x] 5.5 Prune Expo-generated native/build directories during scaffolding and CLI packaging so local
      acceptance artifacts cannot slow tests or leak into generated/published projects.
- [x] 5.6 Re-run OpenSpec, template type, CLI test/build, format, and secret checks.

## 6. Acceptance refinements

- [x] 6.1 Add a validated conversational `text` result kind and render it as native text without
      exposing envelope metadata or JSON syntax.
- [x] 6.2 Make Domain Desktop and History & Tasks horizontally pageable with route state and a page
      indicator.
- [x] 6.3 Rebuild the left drawer as a left-to-right panel with a domain selector, session search,
      flexible-height history list, and fixed user entry; make the top-bar entry icon-only and close
      an expanded agent sheet first.
- [x] 6.4 Update machine-readable action/test-id maps and documentation.
- [x] 6.5 Re-run template, CLI, OpenSpec, format, and secret checks.

## 7. Session layout and bilingual acceptance refinements

- [x] 7.1 Keep the left drawer's leading edge aligned with the screen edge during its left-to-right
      animation.
- [x] 7.2 Fix the agent session sheet at 80% height, dock the prompt composer at its bottom with a
      two-row input minimum, and scroll result/process content independently above it.
- [x] 7.3 Add persisted Simplified Chinese/English user settings with Chinese as the default, localized
      primary UI, localized provider output, and locale-aware speech recognition.
- [x] 7.4 Update machine-readable action/test-id maps, specifications, and bilingual documentation.
- [ ] 7.5 Re-run template, CLI, OpenSpec, format, build, and secret checks.

## 8. Workspace dock and prompt acceptance refinements

- [x] 8.1 Consolidate the drawer shortcut, multi-desktop indicator, and new-session shortcut into one
      horizontally centered workspace dock.
- [x] 8.2 Embed the microphone and circular upward-arrow send action inside the prompt input
      container.
- [x] 8.3 Remove the duplicate sheet grab handle, persistent agent title/provider block, event-count
      block, and floating-orb `agent` label; retain execution state in the process surface.
- [x] 8.4 Record the no-Zustand runtime-state decision and update machine-readable maps/docs.
- [ ] 8.5 Re-run template type, CLI test/build, OpenSpec, format, lint, and secret checks.
