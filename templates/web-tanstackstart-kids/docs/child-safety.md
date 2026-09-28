# Child Safety, Privacy, And Engagement Baseline

This document is a product baseline, not legal advice or a compliance certification. Product teams remain responsible for their jurisdiction, age rating, consent model, data policy, and educational claims.

## Privacy Defaults

- Persist a coarse age band only: `sprout`, `explorer`, or `creator`.
- Do not ask for or store a birth date by default.
- Do not add advertising, third-party behavioral tracking, social feeds, public child profiles, or precise location by default.
- Collect only data required for the product behavior being delivered.
- Require a separate privacy review before adding analytics, personalization, messaging, user-generated content, or cloud profile storage.

## Guardian Boundary

Use `GuardianGate` or an equivalent explicit flow before:

- opening an external destination;
- making a purchase or requesting payment information;
- changing account, privacy, or safety settings;
- sharing personal information or media;
- enabling a feature that affects other people or persists publicly.

The gate is a product safeguard, not proof that a guardian was present.

## Interaction Defaults

- Do not punish errors, inactivity, or choosing a different path.
- Prefer undo and recovery over irreversible actions.
- Use explicit confirmation for young profiles when undo is not possible.
- Do not use timed pressure, shame, streak loss, public comparison, random reward chests, or infinite engagement loops by default.
- Provide one clear primary action per meaningful region.
- Keep copy short, concrete, and non-blaming.

## Accessibility And Sensory Safety

- Preserve Astryx keyboard, focus, ARIA, disabled, and validation behavior.
- Keep focus visible and contrast validated in light and dusk modes.
- Support `prefers-reduced-motion`.
- Never make audio the only way to understand or complete an activity.
- Keep transcripts or equivalent text available for read-aloud content.
- Avoid flashing, rapid parallax, uncontrolled rotation, and motion that blocks the next action.

## Manual Review Before Adding Analytics, Social Features, Or Personalization

- What child data is collected?
- Is the data necessary for the feature?
- Who can access it?
- How long is it retained?
- Is the collection understandable to a guardian?
- Does the feature create pressure, comparison, shame, or public exposure?
- Can the feature be disabled without breaking the core activity?
- Does it preserve reduced-motion, audio-off, keyboard-only, and screen-reader paths?
- Has the product owner documented the applicable legal and policy review?
