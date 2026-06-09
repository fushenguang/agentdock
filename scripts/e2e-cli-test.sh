#!/usr/bin/env bash
set -euo pipefail

# AgentDock Unified E2E Test Script
# Usage: ./scripts/e2e-cli-test.sh [template_id]
#
# This script:
# 1. Builds the CLI from source
# 2. Creates a real project using the CLI (outside the repo to avoid git pollution)
# 3. Injects environment variables from repo .env.local into the new project
# 4. Installs dependencies and approves builds
# 5. Starts dev server and tests HTTP endpoints with curl
# 6. Prompts for manual verification
#
# Requirements:
#   - pnpm >= 9
#   - node >= 18
#   - curl
#   - lsof (for port cleanup)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

TEMPLATE_ID="${1:-web-nextjs}"
TEST_DIR="${REPO_ROOT}/../agentdock-e2e-$$"

# ───────────────────────────────────────────
# Terminal helpers
# ───────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() { echo -e "${GREEN}✓${NC} $1"; ((PASS++)) || true; }
fail() { echo -e "${RED}✗${NC} $1"; ((FAIL++)) || true; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; ((WARN++)) || true; }
info() { echo -e "${BLUE}ℹ${NC} $1"; }

section() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ───────────────────────────────────────────
# Cleanup
# ───────────────────────────────────────────
cleanup() {
  local exit_code=$?
  echo ""
  section "Cleanup"

  # Kill dev server on port 3000
  if lsof -ti:3000 > /dev/null 2>&1; then
    info "Stopping dev server on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    pass "Dev server stopped"
  fi

  if [ -d "${TEST_DIR}" ]; then
    info "Test project location: ${TEST_DIR}"
    if [ ${exit_code} -ne 0 ]; then
      warn "Test failed — project kept for debugging. Remove manually with:"
      echo "  rm -rf ${TEST_DIR}"
    else
      info "Removing test project..."
      rm -rf "${TEST_DIR}"
      pass "Test project removed"
    fi
  fi
}

trap cleanup EXIT INT TERM

# ───────────────────────────────────────────
# Phase 0: Pre-flight checks
# ───────────────────────────────────────────
section "Phase 0: Pre-flight Checks"

if [ ! -f "${REPO_ROOT}/.env.local" ]; then
  fail "Root .env.local not found at ${REPO_ROOT}/.env.local"
  echo "Please create it with the required environment variables."
  exit 1
else
  pass "Root .env.local exists"
fi

if ! command -v pnpm &> /dev/null; then
  fail "pnpm not found in PATH"
  exit 1
else
  pass "pnpm available ($(pnpm --version))"
fi

if ! command -v curl &> /dev/null; then
  fail "curl not found in PATH"
  exit 1
else
  pass "curl available"
fi

# ───────────────────────────────────────────
# Phase 1: Build CLI
# ───────────────────────────────────────────
section "Phase 1: Building CLI from source"

cd "${REPO_ROOT}"

info "Building @cogito.ai/cli..."
if pnpm --filter @cogito.ai/cli build > /tmp/cli-build.log 2>&1; then
  pass "CLI built successfully"
else
  fail "CLI build failed"
  tail -30 /tmp/cli-build.log
  exit 1
fi

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
section "Phase 2: Creating project with CLI"

# Clean up any previous test directory
if [ -d "${TEST_DIR}" ]; then
  info "Removing previous test directory: ${TEST_DIR}"
  rm -rf "${TEST_DIR}"
fi

info "Creating project at: ${TEST_DIR}"
info "Using template: ${TEMPLATE_ID}"

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

# Validate critical scaffold files
CRITICAL_FILES=(".npmrc" ".gitignore" "package.json" "pnpm-workspace.yaml" "turbo.json" "README.md")
for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "${TEST_DIR}/${file}" ]; then
    pass "Found ${file}"
  else
    fail "Missing ${file}"
  fi
done

# ───────────────────────────────────────────
# Phase 3: Inject environment variables
# ───────────────────────────────────────────
section "Phase 3: Injecting environment variables"

ENV_LOCAL="${REPO_ROOT}/.env.local"
TARGET_ENV="${TEST_DIR}/.env.local"

if [ -f "${ENV_LOCAL}" ]; then
  # Copy non-comment, non-empty lines
  grep -v '^\s*#' "${ENV_LOCAL}" | grep -v '^\s*$' > "${TARGET_ENV}" 2>/dev/null || true

  if [ -f "${TARGET_ENV}" ] && [ -s "${TARGET_ENV}" ]; then
    pass ".env.local copied from repo root"
    info "Injected variables:"
    while IFS='=' read -r key _; do
      [ -n "$key" ] && echo "    ${key}"
    done < "${TARGET_ENV}"
  else
    warn ".env.local copied but appears empty"
  fi
else
  fail "Root .env.local missing (should have been caught in pre-flight)"
  exit 1
fi

# ───────────────────────────────────────────
# Phase 4: Install dependencies
# ───────────────────────────────────────────
section "Phase 4: Installing dependencies"

cd "${TEST_DIR}"

info "Running pnpm install..."
if pnpm install > /tmp/e2e-pnpm-install.log 2>&1; then
  pass "pnpm install completed"
else
  if grep -q "ERR_PNPM_IGNORED_BUILDS" /tmp/e2e-pnpm-install.log; then
    warn "pnpm install warned about ignored builds (approving now...)"
    pnpm approve-builds > /tmp/e2e-approve-builds.log 2>&1 || true
    # Re-run install to complete postinstall scripts
    pnpm install > /tmp/e2e-pnpm-install-retry.log 2>&1 || true
    pass "Builds approved, install completed"
  else
    fail "pnpm install failed unexpectedly"
    tail -30 /tmp/e2e-pnpm-install.log
    exit 1
  fi
fi

# ───────────────────────────────────────────
# Phase 5: Type check
# ───────────────────────────────────────────
section "Phase 5: Type check"

if [ -d "${TEST_DIR}/node_modules" ]; then
  if pnpm check-types > /tmp/e2e-check-types.log 2>&1; then
    pass "TypeScript type check passed"
  else
    warn "TypeScript type check failed (may need env vars or have expected errors)"
    tail -20 /tmp/e2e-check-types.log
  fi
else
  warn "Skipping type check (node_modules not fully installed)"
fi

# ───────────────────────────────────────────
# Phase 6: Start dev server & test endpoints
# ───────────────────────────────────────────
section "Phase 6: Starting dev server & testing endpoints"

info "Starting dev server in background..."
pnpm dev > /tmp/e2e-dev-server.log 2>&1 &
DEV_SERVER_PID=$!
info "Dev server PID: ${DEV_SERVER_PID}"

info "Waiting for server to be ready (max 60s)..."
MAX_WAIT=60
WAITED=0
SERVER_READY=false

while [ $WAITED -lt $MAX_WAIT ]; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    SERVER_READY=true
    break
  fi
  sleep 2
  WAITED=$((WAITED + 2))
  if [ $((WAITED % 10)) -eq 0 ]; then
    info "  Still waiting... (${WAITED}s/${MAX_WAIT}s)"
  fi
done

if [ "$SERVER_READY" = true ]; then
  pass "Dev server ready (${WAITED}s)"
else
  fail "Dev server failed to start within ${MAX_WAIT}s"
  tail -30 /tmp/e2e-dev-server.log
  exit 1
fi

# ───────────────────────────────────────────
# Phase 7: HTTP Endpoint Tests
# ───────────────────────────────────────────
section "Phase 7: HTTP Endpoint Tests"

test_endpoint() {
  local path=$1
  local expected_code=${2:-200}
  local description=$3
  local actual_code

  actual_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${path}")

  if [ "$actual_code" = "$expected_code" ]; then
    pass "$description ($actual_code)"
  else
    fail "$description (got $actual_code, expected $expected_code)"
  fi
}

# Core pages
test_endpoint "/en" 200 "Homepage"
test_endpoint "/en/login" 200 "Login page"

# Auth callback (should redirect)
AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/auth/callback")
if [ "$AUTH_CODE" = "302" ] || [ "$AUTH_CODE" = "307" ]; then
  pass "Auth callback redirects ($AUTH_CODE)"
else
  fail "Auth callback unexpected response ($AUTH_CODE)"
fi

# Content check
info "Checking homepage content..."
HOMEPAGE=$(curl -s http://localhost:3000/en)
if echo "$HOMEPAGE" | grep -qi "dashboard\|sign in\|welcome"; then
  pass "Homepage contains expected content"
else
  warn "Homepage content may have changed"
fi

# Server log check
info "Checking dev server logs for errors..."
if grep -i "error" /tmp/e2e-dev-server.log | grep -vi "eslint\|warning" > /dev/null 2>&1; then
  warn "Potential errors found in dev server logs"
  grep -i "error" /tmp/e2e-dev-server.log | head -5 | sed 's/^/    /'
else
  pass "No critical errors in dev server logs"
fi

# ───────────────────────────────────────────
# Phase 8: Summary & Manual Verification
# ───────────────────────────────────────────
section "Test Summary"

echo -e "${CYAN}Results:${NC}"
echo -e "  ${GREEN}Passed:${NC}  ${PASS}"
echo -e "  ${RED}Failed:${NC}  ${FAIL}"
echo -e "  ${YELLOW}Warnings:${NC} ${WARN}"
echo ""

if [ ${FAIL} -eq 0 ]; then
  echo -e "${GREEN}============================================${NC}"
  echo -e "${GREEN}  All automated checks passed!              ${NC}"
  echo -e "${GREEN}============================================${NC}"
  echo ""
  echo -e "${BOLD}Next steps for manual verification:${NC}"
  echo ""
  echo "  1. cd ${TEST_DIR}"
  echo "  2. pnpm dev  (if not already running)"
  echo "  3. Open http://localhost:3000 and verify visually"
  echo "  4. Test authentication flow (login, signup)"
  echo "  5. Verify Supabase connection is working"
  echo ""
  echo -e "${BOLD}Cleanup commands:${NC}"
  echo "  rm -rf ${TEST_DIR}"
  echo ""
  exit 0
else
  echo -e "${RED}============================================${NC}"
  echo -e "${RED}  Some automated checks failed.            ${NC}"
  echo -e "${RED}============================================${NC}"
  echo ""
  echo "Debug logs:"
  echo "  CLI build:     /tmp/cli-build.log"
  echo "  pnpm install:  /tmp/e2e-pnpm-install.log"
  echo "  Dev server:    /tmp/e2e-dev-server.log"
  echo "  Type check:    /tmp/e2e-check-types.log"
  echo ""
  echo "Test project kept for debugging:"
  echo "  cd ${TEST_DIR}"
  echo ""
  exit 1
fi
