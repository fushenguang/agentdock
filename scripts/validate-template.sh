#!/bin/bash

# Template Validation Script
# Validates web-nextjs template before merging to main
# Usage: ./scripts/validate-template.sh

set -e

TEMPLATE_DIR="templates/web-nextjs/apps/web"
COLOR_RESET='\033[0m'
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'

echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}  Template Validation Suite${COLOR_RESET}"
echo -e "${COLOR_BLUE}  $(date)${COLOR_RESET}"
echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass() {
    echo -e "${COLOR_GREEN}✓ PASS${COLOR_RESET}: $1"
    PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
    echo -e "${COLOR_RED}✗ FAIL${COLOR_RESET}: $1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

warn() {
    echo -e "${COLOR_YELLOW}⚠ WARN${COLOR_RESET}: $1"
    WARN_COUNT=$((WARN_COUNT + 1))
}

section() {
    echo ""
    echo -e "${COLOR_BLUE}--- $1 ---${COLOR_RESET}"
}

# ==========================================
# Section 1: Environment Check
# ==========================================
section "Environment Check"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    pass "Node.js installed: $NODE_VERSION"
else
    fail "Node.js not found"
fi

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    pass "pnpm installed: $PNPM_VERSION"
else
    fail "pnpm not found (required for monorepo)"
fi

if [ ! -d "$TEMPLATE_DIR" ]; then
    fail "Template directory not found: $TEMPLATE_DIR"
    exit 1
else
    pass "Template directory exists"
fi

# ==========================================
# Section 2: Dependency Installation
# ==========================================
section "Dependency Installation"

cd "$TEMPLATE_DIR"

echo "Installing dependencies..."
if pnpm install --frozen-lockfile 2>&1 | tee /tmp/pnpm-install.log; then
    pass "Dependencies installed successfully"
else
    # Try without frozen lockfile
    warn "Frozen lockfile failed, trying regular install..."
    if pnpm install 2>&1 | tee /tmp/pnpm-install.log; then
        pass "Dependencies installed (non-frozen)"
    else
        fail "Dependency installation failed"
        cat /tmp/pnpm-install.log
        exit 1
    fi
fi

# ==========================================
# Section 3: Linting
# ==========================================
section "Code Quality (Linting)"

if pnpm lint 2>&1 | tee /tmp/lint.log; then
    pass "ESLint passed with no errors"
else
    fail "ESLint found errors"
    cat /tmp/lint.log
fi

# Check for Layer 2 violations specifically
if grep -q "restricted from being used" /tmp/lint.log; then
    fail "Layer 2 architecture violations detected"
    grep "restricted from being used" /tmp/lint.log
else
    pass "No Layer 2 violations"
fi

# ==========================================
# Section 4: Type Checking
# ==========================================
section "Type Safety"

if pnpm check-types 2>&1 | tee /tmp/types.log; then
    pass "TypeScript compilation successful"
else
    fail "TypeScript errors found"
    cat /tmp/types.log
fi

# ==========================================
# Section 5: Build
# ==========================================
section "Production Build"

if pnpm build 2>&1 | tee /tmp/build.log; then
    pass "Production build successful"
else
    fail "Production build failed"
    cat /tmp/build.log
fi

# Check build output size
if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    pass "Build output generated: $BUILD_SIZE"
else
    fail "Build output not found (.next directory missing)"
fi

# ==========================================
# Section 6: Architecture Validation
# ==========================================
section "Architecture Validation"

# Check Layer 2 constraints manually
echo "Checking Layer 2 constraint: features should not import infra directly..."

# Allow infra/providers (it's the DI container), but block direct db/client access in actions.ts
# Exception: server.ts is an infrastructure helper that can import getServerClient
FEATURES_ACTIONS_VIOLATIONS=$(grep -r "from '@/infra/db/client'" src/features/*/actions.ts 2>/dev/null || true)
if [ -z "$FEATURES_ACTIONS_VIOLATIONS" ]; then
    pass "No direct DB client imports in features/actions layer"
else
    fail "Found direct DB client imports in features/actions (use Repository pattern):"
    echo "$FEATURES_ACTIONS_VIOLATIONS"
fi

# Check that server.ts has proper eslint-disable comment if it imports infra
if grep -q "from '@/infra/db/client'" src/features/auth/server.ts 2>/dev/null; then
    if grep -B1 "from '@/infra/db/client'" src/features/auth/server.ts | grep -q "eslint-disable"; then
        pass "server.ts has eslint-disable for infra import (allowed as infrastructure helper)"
    else
        warn "server.ts imports infra without eslint-disable comment"
    fi
fi

# Check that repositories exist
if [ -f "src/core/repositories/IAuthRepository.ts" ]; then
    pass "IAuthRepository interface exists"
else
    fail "IAuthRepository interface missing"
fi

if [ -f "src/infra/db/SupabaseAuthRepository.ts" ]; then
    pass "SupabaseAuthRepository implementation exists"
else
    fail "SupabaseAuthRepository implementation missing"
fi

# ==========================================
# Section 7: Feature Completeness Check
# ==========================================
section "Feature Completeness"

# Password reset pages
if [ -f "src/app/[locale]/(auth)/forgot-password/page.tsx" ]; then
    pass "Forgot password page exists"
else
    fail "Forgot password page missing"
fi

if [ -f "src/app/[locale]/(auth)/reset-password/page.tsx" ]; then
    pass "Reset password page exists"
else
    fail "Reset password page missing"
fi

# Profile page (check both possible paths)
if [ -f "src/app/[locale]/(dashboard)/settings/profile/page.tsx" ] || \
   [ -f "src/app/[locale]/(protected)/settings/profile/page.tsx" ]; then
    pass "Profile settings page exists"
else
    fail "Profile settings page missing"
fi

# Auth callback with whitelist
if [ -f "src/app/auth/callback/route.ts" ]; then
    if grep -q "ALLOWED_NEXT" src/app/auth/callback/route.ts; then
        pass "Auth callback has open redirect protection"
    else
        fail "Auth callback missing open redirect protection"
    fi
else
    fail "Auth callback route missing"
fi

# Server Actions
if [ -f "src/features/auth/actions.ts" ]; then
    if grep -q "requestPasswordReset" src/features/auth/actions.ts; then
        pass "Password reset action exists"
    else
        fail "Password reset action missing"
    fi

    if grep -q "updateDisplayName" src/features/auth/actions.ts; then
        pass "Display name update action exists"
    else
        fail "Display name update action missing"
    fi
else
    fail "Auth actions file missing"
fi

# Zod schemas
if [ -f "src/lib/validations/auth.ts" ]; then
    if grep -q "forgotPasswordSchema" src/lib/validations/auth.ts && \
       grep -q "resetPasswordSchema" src/lib/validations/auth.ts && \
       grep -q "displayNameSchema" src/lib/validations/auth.ts; then
        pass "All auth validation schemas present"
    else
        fail "Some auth validation schemas missing"
    fi
else
    fail "Auth validations file missing"
fi

# ==========================================
# Section 8: i18n Check
# ==========================================
section "Internationalization"

if [ -d "messages" ]; then
    EN_MESSAGES=$(ls messages/en.json 2>/dev/null || echo "")
    ZH_MESSAGES=$(ls messages/zh.json 2>/dev/null || echo "")

    if [ -n "$EN_MESSAGES" ] && [ -n "$ZH_MESSAGES" ]; then
        pass "Both en and zh locale files exist"

        # Check for key translations (support both nested and flat structures)
        if (grep -q "auth.forgotPassword.title" messages/en.json || grep -q "forgotPasswordTitle" messages/en.json) && \
           (grep -q "auth.forgotPassword.title" messages/zh.json || grep -q "forgotPasswordTitle" messages/zh.json); then
            pass "Password reset translations present"
        else
            warn "Some translation keys may be missing"
        fi
    else
        fail "Missing locale files"
    fi
else
    fail "Messages directory not found"
fi

# ==========================================
# Section 9: Security Checks
# ==========================================
section "Security Checks"

# Check for hardcoded secrets
# Check for hardcoded secrets (ignore process.env references and comments)
if grep -rE "(supabase_url|SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL)\s*=\s*['\"]sb-[a-z0-9]" src/ 2>/dev/null | grep -v "process.env" | grep -v "//"; then
    fail "Potential hardcoded Supabase URL found"
    SECRETS_FOUND=true
fi

# Only flag actual key values, not env var references or type definitions
if grep -rE "(SUPABASE_ANON_KEY|service_role_key)\s*[:=]\s*['\"][A-Za-z0-9_\-]{20,}['\"]" src/ 2>/dev/null | grep -v "process.env" | grep -v "//" | grep -v "\.d\.ts"; then
    fail "Potential hardcoded API key found"
    SECRETS_FOUND=true
fi

if [ "$SECRETS_FOUND" = false ]; then
    pass "No hardcoded secrets detected"
fi

# Check for console.log in production code (optional warning)
# Exclude API route handlers where error logging is expected
CONSOLE_LOGS=$(grep -r "console\." src/features/ src/app/ 2>/dev/null | grep -v "src/app/api/" | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    warn "Found $CONSOLE_LOGS console statements in features/app layers (consider removing for production)"
else
    pass "No console statements in production code (API routes excluded)"
fi

# ==========================================
# Section 10: File Structure Validation
# ==========================================
section "File Structure"

REQUIRED_FILES=(
    "src/core/repositories/IAuthRepository.ts"
    "src/infra/db/SupabaseAuthRepository.ts"
    "src/features/auth/actions.ts"
    "src/features/auth/server.ts"
    "src/lib/validations/auth.ts"
    "tsconfig.json"
)

OPTIONAL_FILES=(
    "src/middleware.ts:Middleware (may use next.config.ts instead)"
    "next.config.mjs|next.config.ts:Next.js config file"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        pass "Required file exists: $file"
    else
        fail "Required file missing: $file"
    fi
done

# Check optional files
for entry in "${OPTIONAL_FILES[@]}"; do
    IFS=':' read -r paths description <<< "$entry"
    FOUND=false
    IFS='|' read -ra PATH_ARRAY <<< "$paths"
    for path in "${PATH_ARRAY[@]}"; do
        if [ -f "$path" ]; then
            pass "Optional file exists: $path ($description)"
            FOUND=true
            break
        fi
    done
    if [ "$FOUND" = false ]; then
        warn "Optional file missing: $paths ($description)"
    fi
done

# ==========================================
# Summary
# ==========================================
echo ""
echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}  Validation Summary${COLOR_RESET}"
echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo -e "${COLOR_GREEN}Passed:${COLOR_RESET}   $PASS_COUNT"
echo -e "${COLOR_RED}Failed:${COLOR_RESET}   $FAIL_COUNT"
echo -e "${COLOR_YELLOW}Warnings:${COLOR_RESET} $WARN_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${COLOR_GREEN}✓ All critical checks passed!${COLOR_RESET}"
    echo ""
    echo -e "${COLOR_BLUE}Next steps:${COLOR_RESET}"
    echo "1. Review warnings above (if any)"
    echo "2. Manually test the dev server: pnpm dev"
    echo "3. Test password reset flow in browser"
    echo "4. Verify sidebar links (no url: '#')"
    echo "5. Test open redirect protection"
    echo "6. Run E2E tests if environment is configured"
    echo ""
    exit 0
else
    echo -e "${COLOR_RED}✗ Validation failed with $FAIL_COUNT error(s)${COLOR_RESET}"
    echo ""
    echo -e "${COLOR_RED}Please fix the failures above before merging.${COLOR_RESET}"
    exit 1
fi
