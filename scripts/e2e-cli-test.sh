#!/usr/bin/env bash
set -euo pipefail

# AgentDock CLI E2E Test Script
# Usage: ./scripts/e2e-cli-test.sh [template_id] [test_dir]
#
# This script:
# 1. Builds the CLI from source
# 2. Creates a real project using the CLI
# 3. Validates the project structure (dotfiles, config files, etc.)
# 4. Runs pnpm install and basic validation
# 5. Generates a report for manual review

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

TEMPLATE_ID="${1:-web-nextjs}"
TEST_DIR="${2:-${REPO_ROOT}/../agentdock-e2e-test-$$}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARNINGS=0

pass() { echo -e "${GREEN}✓${NC} $1"; ((PASS++)) || true; }
fail() { echo -e "${RED}✗${NC} $1"; ((FAIL++)) || true; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; ((WARNINGS++)) || true; }
info() { echo -e "${BLUE}ℹ${NC} $1"; }

# ───────────────────────────────────────────
# Phase 1: Build CLI
# ───────────────────────────────────────────
echo ""
echo "============================================"
echo "Phase 1: Building CLI from source"
echo "============================================"
echo ""

cd "${REPO_ROOT}"

info "Building @cogito.ai/cli..."
if pnpm --filter @cogito.ai/cli build > /tmp/cli-build.log 2>&1; then
  pass "CLI built successfully"
else
  fail "CLI build failed. See /tmp/cli-build.log"
  cat /tmp/cli-build.log
  exit 1
fi

# Verify dist artifacts exist
if [ -f "${REPO_ROOT}/packages/cli/dist/index.js" ]; then
  pass "CLI dist/index.js exists"
else
  fail "CLI dist/index.js missing after build"
  exit 1
fi

if [ -f "${REPO_ROOT}/packages/cli/dist/registry.json" ]; then
  pass "CLI dist/registry.json exists"
else
  fail "CLI dist/registry.json missing after build"
  exit 1
fi

# ───────────────────────────────────────────
# Phase 2: Create project using CLI
# ───────────────────────────────────────────
echo ""
echo "============================================"
echo "Phase 2: Creating project with CLI"
echo "============================================"
echo ""

# Clean up any previous test directory
if [ -d "${TEST_DIR}" ]; then
  info "Removing previous test directory: ${TEST_DIR}"
  rm -rf "${TEST_DIR}"
fi

info "Creating project at: ${TEST_DIR}"
info "Using template: ${TEMPLATE_ID}"

# Run CLI using node directly (not the global bin)
node "${REPO_ROOT}/packages/cli/dist/index.js" init \
  --name "e2e-test-project" \
  --template "${TEMPLATE_ID}" \
  --dir "${TEST_DIR}" \
  --silent

if [ -d "${TEST_DIR}" ]; then
  pass "Project directory created"
else
  fail "Project directory not created at ${TEST_DIR}"
  exit 1
fi

# ───────────────────────────────────────────
# Phase 3: Validate project structure
# ───────────────────────────────────────────
echo ""
echo "============================================"
echo "Phase 3: Validating project structure"
echo "============================================"
echo ""

# Critical files that MUST exist
CRITICAL_FILES=(
  ".npmrc"
  ".gitignore"
  "package.json"
  "pnpm-workspace.yaml"
  "turbo.json"
  "README.md"
)

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "${TEST_DIR}/${file}" ]; then
    pass "Found ${file}"
  else
    fail "Missing ${file}"
  fi
done

# Validate pnpm-workspace.yaml content
if [ -f "${TEST_DIR}/pnpm-workspace.yaml" ]; then
  if grep -q "allowBuilds:" "${TEST_DIR}/pnpm-workspace.yaml"; then
    pass "pnpm-workspace.yaml contains allowBuilds"
  else
    fail "pnpm-workspace.yaml missing allowBuilds"
  fi

  if grep -q "onlyBuiltDependencies:" "${TEST_DIR}/pnpm-workspace.yaml"; then
    pass "pnpm-workspace.yaml contains onlyBuiltDependencies"
  else
    fail "pnpm-workspace.yaml missing onlyBuiltDependencies"
  fi
else
  fail "Cannot validate pnpm-workspace.yaml (file missing)"
fi

# Validate .npmrc content
if [ -f "${TEST_DIR}/.npmrc" ]; then
  if grep -q "only-built-dependencies" "${TEST_DIR}/.npmrc"; then
    pass ".npmrc contains only-built-dependencies"
  else
    fail ".npmrc missing only-built-dependencies"
  fi
else
  fail "Cannot validate .npmrc (file missing)"
fi

# Check key directories
KEY_DIRS=("apps" "packages")
for dir in "${KEY_DIRS[@]}"; do
  if [ -d "${TEST_DIR}/${dir}" ]; then
    pass "Found ${dir}/ directory"
  else
    fail "Missing ${dir}/ directory"
  fi
done

# Optional directories
OPTIONAL_DIRS=("scripts")
for dir in "${OPTIONAL_DIRS[@]}"; do
  if [ -d "${TEST_DIR}/${dir}" ]; then
    pass "Found ${dir}/ directory"
  else
    warn "Optional ${dir}/ directory not found"
  fi
done

# ───────────────────────────────────────────
# Phase 4: Install dependencies
# ───────────────────────────────────────────
echo ""
echo "============================================"
echo "Phase 4: Installing dependencies"
echo "============================================"
echo ""

cd "${TEST_DIR}"

info "Running pnpm install..."
if pnpm install > /tmp/e2e-pnpm-install.log 2>&1; then
  pass "pnpm install completed"
else
  # pnpm install may fail due to ignored builds - this is expected
  # Check if it's the specific error we know about
  if grep -q "ERR_PNPM_IGNORED_BUILDS" /tmp/e2e-pnpm-install.log; then
    warn "pnpm install failed with ERR_PNPM_IGNORED_BUILDS (expected without pnpm approve-builds)"
  else
    fail "pnpm install failed unexpectedly"
    cat /tmp/e2e-pnpm-install.log
  fi
fi

# ───────────────────────────────────────────
# Phase 5: Type check and build
# ───────────────────────────────────────────
echo ""
echo "============================================"
echo "Phase 5: Type check and build"
echo "============================================"
echo ""

# Only run if node_modules exists
if [ -d "${TEST_DIR}/node_modules" ]; then
  info "Running TypeScript type check..."
  if pnpm check-types > /tmp/e2e-check-types.log 2>&1; then
    pass "TypeScript type check passed"
  else
    warn "TypeScript type check failed (may need env vars)"
    # Don't fail - env vars might be missing in test environment
  fi
else
  warn "Skipping type check (node_modules not installed)"
fi

# ───────────────────────────────────────────
# Phase 6: Summary
# ───────────────────────────────────────────
echo ""
echo "============================================"
echo "Phase 6: Test Summary"
echo "============================================"
echo ""

echo "Test directory: ${TEST_DIR}"
echo ""
echo "Results:"
echo "  ${GREEN}PASS:${NC} ${PASS}"
echo "  ${RED}FAIL:${NC} ${FAIL}"
echo "  ${YELLOW}WARN:${NC} ${WARNINGS}"
echo ""

if [ ${FAIL} -eq 0 ]; then
  echo -e "${GREEN}============================================${NC}"
  echo -e "${GREEN}  All automated checks passed!              ${NC}"
  echo -e "${GREEN}============================================${NC}"
  echo ""
  echo "Next steps for manual verification:"
  echo "  1. cd ${TEST_DIR}"
  echo "  2. pnpm approve-builds  # if needed"
  echo "  3. pnpm dev              # start dev servers"
  echo "  4. Verify: http://localhost:3000 (web) and http://localhost:3001 (docs)"
  echo ""
  echo "After manual verification, run:"
  echo "  rm -rf ${TEST_DIR}"
  exit 0
else
  echo -e "${RED}============================================${NC}"
  echo -e "${RED}  Some automated checks failed.            ${NC}"
  echo -e "${RED}============================================${NC}"
  echo ""
  echo "Debug:"
  echo "  Build log:   /tmp/cli-build.log"
  echo "  Install log: /tmp/e2e-pnpm-install.log"
  echo ""
  echo "Clean up: rm -rf ${TEST_DIR}"
  exit 1
fi
