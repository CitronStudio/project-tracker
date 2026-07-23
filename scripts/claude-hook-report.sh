#!/usr/bin/env bash
# Reports "a Claude Code session just ended in this repo" to project-tracker.
#
# Intended to be wired up as a Claude Code `Stop` hook in OTHER repositories
# (the ones you track), not in project-tracker itself. See docs/claude-code-hook.md.
#
# Required environment variables:
#   TRACKER_API_URL      e.g. https://your-tracker.example.com (no trailing slash)
#   TRACKER_PROJECT_ID   the project's id, copied from its detail page in the tracker
# Optional (only if the tracker deployment has APP_PASSWORD set):
#   TRACKER_USERNAME     defaults to "admin"
#   TRACKER_PASSWORD
#
# Never blocks or fails the Claude Code session: all errors are swallowed.

set -u

if [ -z "${TRACKER_API_URL:-}" ] || [ -z "${TRACKER_PROJECT_ID:-}" ]; then
  exit 0
fi

SUMMARY="$(git log -1 --pretty=%s 2>/dev/null)"
if [ -z "$SUMMARY" ]; then
  SUMMARY="Claude Codeセッションが終了しました"
fi

# JSON-escape the summary (backslash, quote, newline).
ESCAPED_SUMMARY=$(printf '%s' "$SUMMARY" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ')

AUTH_ARGS=()
if [ -n "${TRACKER_PASSWORD:-}" ]; then
  AUTH_ARGS=(-u "${TRACKER_USERNAME:-admin}:${TRACKER_PASSWORD}")
fi

curl -fsS -m 10 \
  "${AUTH_ARGS[@]}" \
  -X POST "${TRACKER_API_URL}/api/projects/${TRACKER_PROJECT_ID}/logs" \
  -H "Content-Type: application/json" \
  -d "{\"summary\": \"${ESCAPED_SUMMARY}\", \"source\": \"claude-code\"}" \
  >/dev/null 2>&1 || true

exit 0
