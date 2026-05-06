#!/usr/bin/env bash
# =============================================================================
# OpenShelf – GitHub Labels Bootstrap
# =============================================================================
# Usage: bash setup-labels.sh <owner> <repo>
# Requires: GitHub CLI (gh) — https://cli.github.com
# Run once after creating the repository.
# =============================================================================

set -euo pipefail

OWNER="${1:?Usage: $0 <owner> <repo>}"
REPO="${2:?Usage: $0 <owner> <repo>}"

create_label() {
  local name="$1" color="$2" description="$3"
  gh label create "$name" \
    --repo "$OWNER/$REPO" \
    --color "$color" \
    --description "$description" \
    --force          # --force updates if it already exists
}

echo "🏷️  Creating labels for $OWNER/$REPO ..."

# ── Type labels ──────────────────────────────────────────────────────────────
create_label "feature"         "0075ca" "New feature or enhancement"
create_label "bug"             "d73a4a" "Something isn't working"
create_label "refactor"        "e4e669" "Code improvement / tech debt"
create_label "tech-debt"       "fbca04" "Technical debt cleanup"
create_label "documentation"   "0075ca" "Documentation update"
create_label "devops"          "5319e7" "CI/CD, Docker, deployment"
create_label "infrastructure"  "5319e7" "Infrastructure or config"
create_label "hotfix"          "b60205" "Emergency fix targeting main"

# ── Status labels ─────────────────────────────────────────────────────────────
create_label "needs-triage"    "e4e669" "Waiting to be triaged"
create_label "in-progress"     "0e8a16" "Actively being worked on"
create_label "stale"           "cccccc" "No recent activity"
create_label "pull-request"    "0075ca" "Associated with a PR"
create_label "pinned"          "e4e669" "Keep open regardless of staleness"

# ── Priority labels ───────────────────────────────────────────────────────────
create_label "priority: high"   "d73a4a" "Must be done ASAP"
create_label "priority: medium" "fbca04" "Important but not urgent"
create_label "priority: low"    "0e8a16" "Nice to have"

# ── Phase labels ──────────────────────────────────────────────────────────────
create_label "phase-1"         "c5def5" "Phase 1 – Project Setup"
create_label "phase-2"         "c5def5" "Phase 2 – Authentication"
create_label "phase-3"         "c5def5" "Phase 3 – Resource Management"
create_label "phase-4"         "c5def5" "Phase 4 – Social Features"
create_label "phase-5"         "c5def5" "Phase 5 – Search"
create_label "phase-6"         "c5def5" "Phase 6 – Next Phase"

# ── Area labels ───────────────────────────────────────────────────────────────
create_label "frontend"        "bfd4f2" "Next.js / UI layer"
create_label "backend"         "bfd4f2" "Express.js / API layer"
create_label "database"        "bfd4f2" "PostgreSQL / Prisma"
create_label "storage"         "bfd4f2" "MinIO / Cloudflare R2"
create_label "auth"            "bfd4f2" "Authentication / authorisation"

# ── Misc ──────────────────────────────────────────────────────────────────────
create_label "good first issue" "7057ff" "Good for newcomers"
create_label "help wanted"     "008672" "Extra attention is needed"
create_label "wont-fix"        "ffffff" "This will not be worked on"
create_label "duplicate"       "cfd3d7" "This issue or PR already exists"
create_label "security"        "b60205" "Security-related issue"

echo ""
echo "✅  All labels created for $OWNER/$REPO"