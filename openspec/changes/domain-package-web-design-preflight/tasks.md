## 1. Planning

- [x] 1.1 Create the OpenSpec proposal, design, task list, and capability delta
- [x] 1.2 Align the flow with the owner's preflight-first direction

## 2. Domain Package Skill

- [x] 2.1 Add `domain-package-web-design` with package intake, page brief, reference roles, and Astryx mapping references
- [x] 2.2 Add the Claude discovery link
- [x] 2.3 Copy the skill into generated `apps/web/.agents/skills/` projects

## 3. Design Contract

- [x] 3.1 Add audience, hierarchy, visual direction, page grammar, content policy, hidden-by-default, interaction, and page briefs to the Web template `DESIGN.md`
- [x] 3.2 Add product-specific sections and page briefs to the current podcast package Web `DESIGN.md`
- [x] 3.3 Update Web and domain-package `AGENTS.md` plus `LLM.md` read order and UI workflow

## 4. Preflight Enforcement

- [x] 4.1 Parse and require a complete page-brief row in `page:new`
- [x] 4.2 Add missing-brief and complete-brief tests
- [x] 4.3 Update `add-web-route` guidance for both the template and current package

## 5. Documentation

- [x] 5.1 Update English and Chinese Web template docs
- [x] 5.2 Add the current package design decision and replace the superseded UI-delivery harness guidance

## 6. Verification

- [x] 6.1 Validate the OpenSpec change
- [x] 6.2 Run AgentDock template tests, type checks, build, and workspace checks
- [x] 6.3 Run the current podcast package `pnpm check`
- [x] 6.4 Verify the generated package contains the skill and page-brief gate
- [ ] 6.5 Stop before commit, push, publish, or release
