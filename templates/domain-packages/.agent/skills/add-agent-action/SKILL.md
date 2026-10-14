---
name: add-agent-action
description: Add an agent-safe action backed by one package capability.
---

# Add an agent action

1. Create or select one package capability with the same semantics.
2. Declare input schema, effects, authorization audience, risk, idempotency, and cancellation.
3. Map `actionId` to `capabilityId` explicitly.
4. Fail closed when the route or capability is unavailable.
5. Run package and Web checks.
