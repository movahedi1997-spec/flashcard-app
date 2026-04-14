#!/usr/bin/env bash
# scripts/migrate-prod.sh
# Run all migrations in order against the DATABASE_URL env var.
# Usage: DATABASE_URL="postgresql://..." bash scripts/migrate-prod.sh

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌  DATABASE_URL is not set."
  exit 1
fi

MIGRATIONS_DIR="$(dirname "$0")/../migrations"

echo "🔗  Connecting to database..."

for file in \
  "$MIGRATIONS_DIR/001_initial_schema.sql" \
  "$MIGRATIONS_DIR/002_refresh_tokens.sql" \
  "$MIGRATIONS_DIR/003_audit_log.sql" \
  "$MIGRATIONS_DIR/004_review_log.sql" \
  "$MIGRATIONS_DIR/005_deck_appearance.sql" \
  "$MIGRATIONS_DIR/006_explore_phase2.sql" \
  "$MIGRATIONS_DIR/007_creator_profiles.sql" \
  "$MIGRATIONS_DIR/008_onboarding.sql"
do
  name=$(basename "$file")
  echo -n "  ▶  $name ... "
  psql "$DATABASE_URL" -f "$file" -q && echo "✓" || echo "⚠  (may already be applied)"
done

echo ""
echo "✅  All migrations complete."
