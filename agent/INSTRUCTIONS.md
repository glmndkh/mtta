
# Replit Coding Agent – Operating Instructions

## Goal
Surface *every* error/exception/test failure to the app's Notification window with a fix hint.

## What to report
Extract and send as JSON:
{ level, message, stack, file, line, tool, suggestion }

## When to report
- Build errors (vite/webpack/tsc), test failures (jest/pytest), runtime exceptions, tracebacks, CI failures.
- Any CLI output containing: error|failed|exception|traceback.

## How to report
1) POST to `/api/notify` immediately.
2) If POST fails, append one line of JSON to `./notifications.ndjson`.

## Suggestion rule
Always include one actionable fix idea in `suggestion`.

## Tools you'll see
node, npm, vite, jest, ts-node, tsc, webpack, python, pytest, uvicorn, gunicorn.
