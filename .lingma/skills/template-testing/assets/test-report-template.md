# Template Test Report

**Template**: {{template_name}}
**Branch**: {{branch_name}}
**Date**: {{timestamp}}
**Test Level**: {{test_level}}

---

## Summary

- **Status**: {{PASS|FAIL}}
- **Passed**: {{pass_count}}/{{total_count}}
- **Failed**: {{fail_count}}/{{total_count}}
- **Duration**: {{duration}}s

---

## Test Results

### Phase 1: Static Checks

| Test             | Status | Notes |
| ---------------- | ------ | ----- | ----------- |
| ESLint           | {{✓    | ✗}}   | {{details}} |
| TypeScript       | {{✓    | ✗}}   | {{details}} |
| Production Build | {{✓    | ✗}}   | {{details}} |

### Phase 2: Runtime Tests

| Test             | Status | Notes |
| ---------------- | ------ | ----- | ----------------------- |
| Dev Server Start | {{✓    | ✗}}   | Started in {{seconds}}s |
| Homepage (200)   | {{✓    | ✗}}   | {{details}}             |
| Login Page       | {{✓    | ✗}}   | {{details}}             |

### Phase 3: New Features

| Feature          | Endpoint               | Status |
| ---------------- | ---------------------- | ------ | --- |
| Forgot Password  | `/en/forgot-password`  | {{✓    | ✗}} |
| Reset Password   | `/en/reset-password`   | {{✓    | ✗}} |
| Profile Settings | `/en/settings/profile` | {{✓    | ✗}} |

### Phase 4: Security & Architecture

| Check                    | Status | Details |
| ------------------------ | ------ | ------- | -------------- |
| Layer 2 Compliance       | {{✓    | ✗}}     | {{violations}} |
| Open Redirect Protection | {{✓    | ✗}}     | {{details}}    |
| No Hardcoded Secrets     | {{✓    | ✗}}     | {{details}}    |

---

## Failed Tests (if any)

{{#if fail_count > 0}}

1. **{{test_name}}**
   - Expected: {{expected}}
   - Actual: {{actual}}
   - Fix: {{suggestion}}

{{/if}}

---

## Recommendation

{{#if fail_count == 0}}
✅ **READY FOR MERGE** - All tests passed. Safe to merge to main branch.
{{else}}
❌ **BLOCKED** - {{fail_count}} test(s) failed. Please fix before merging.
{{/if}}

---

## Next Steps

{{#if fail_count == 0}}

1. Merge to main: `git checkout main && git merge {{branch_name}}`
2. Update changelog and roadmap docs
3. Create release tag: `git tag v{{version}}`
4. Test with CLI: `agentdock create test-app --template {{template_name}}`
   {{else}}
5. Review failed tests above
6. Fix issues in current branch
7. Re-run test: `./scripts/e2e-template-test-v2.sh`
8. Verify all tests pass before merging
   {{/if}}

---

## Logs

- ESLint Log: `/tmp/lint.log`
- TypeScript Log: `/tmp/types.log`
- Build Log: `/tmp/build.log`
- Dev Server Log: `/tmp/dev-server.log`
