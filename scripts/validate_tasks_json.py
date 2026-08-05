#!/usr/bin/env python3
"""Validate data/tasks.json: valid JSON + the shape the site (js/app.js) expects.

Usage: python3 scripts/validate_tasks_json.py data/tasks.json
Exits non-zero (and prints every problem found) if anything is wrong.
"""
import json
import sys

REQUIRED_FIELDS = ["id", "title", "status", "createdAt", "updatedAt", "history"]
ALLOWED_STATUSES = {"未着手", "進行中", "完了"}
ALLOWED_TYPES = {"task", "incident"}


def main():
    if len(sys.argv) != 2:
        print("usage: validate_tasks_json.py <path-to-tasks.json>", file=sys.stderr)
        return 2

    path = sys.argv[1]
    with open(path, encoding="utf-8") as f:
        raw = f.read()

    try:
        tasks = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"{path}: invalid JSON: {e}", file=sys.stderr)
        return 1

    errors = []

    if not isinstance(tasks, list):
        errors.append("top-level value must be a JSON array")
    else:
        seen_ids = set()
        for i, t in enumerate(tasks):
            label = t.get("title", f"(index {i})") if isinstance(t, dict) else f"(index {i})"

            if not isinstance(t, dict):
                errors.append(f"{label}: task must be an object")
                continue

            for field in REQUIRED_FIELDS:
                if field not in t:
                    errors.append(f"{label}: missing required field '{field}'")

            if "id" in t:
                if t["id"] in seen_ids:
                    errors.append(f"{label}: duplicate id '{t['id']}'")
                seen_ids.add(t["id"])

            if "status" in t and t["status"] not in ALLOWED_STATUSES:
                errors.append(f"{label}: unknown status '{t['status']}'")

            if "type" in t and t["type"] not in ALLOWED_TYPES:
                errors.append(f"{label}: unknown type '{t['type']}'")

            history = t.get("history")
            if history is not None:
                if not isinstance(history, list) or not history:
                    errors.append(f"{label}: 'history' must be a non-empty array")
                else:
                    for j, h in enumerate(history):
                        if not isinstance(h, dict) or "date" not in h or "note" not in h:
                            errors.append(f"{label}: history[{j}] must have 'date' and 'note'")

    if errors:
        print(f"{path}: {len(errors)} problem(s) found:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print(f"{path}: OK ({len(tasks)} tasks)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
