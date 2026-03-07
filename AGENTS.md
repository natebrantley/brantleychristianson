# Agent instructions

This project uses the **Cursor Team Kit** plugin. Use its skills and subagents whenever they fit the task.

## When to use each skill

| Situation | Use this |
|-----------|----------|
| User asks to fix CI, CI failed, or to check build/lint | **check-compiler-errors** then **fix-ci** (or **loop-on-ci** to iterate until CI passes) |
| User wants to clean up AI-generated or sloppy code | **deslop** |
| Merge conflicts need resolving | **fix-merge-conflicts** |
| User wants PR review comments summarized | **get-pr-comments** |
| User wants to watch CI until it passes | **loop-on-ci** or **ci-watcher** subagent |
| User wants a new branch, work done, and a PR opened | **new-branch-and-pr** |
| User pastes a GitHub PR URL or says "review this PR" | **pr-review-canvas** |
| User wants to review, fix issues, and ship via PR | **review-and-ship** |
| User wants to run or fix smoke/E2E tests | **run-smoke-tests** |
| User wants a weekly summary of their commits | **weekly-review** |
| User wants a summary of what they got done (time range) | **what-did-i-get-done** |

## Project setup for Team Kit

- **Build/typecheck**: `npm run build`, `npm run typecheck` — used by check-compiler-errors and CI.
- **CI**: `.github/workflows/ci.yml` — used by fix-ci, loop-on-ci, ci-watcher.
- **Smoke tests**: Playwright in `e2e/`, `npm run test:e2e` — used by run-smoke-tests.

Invoke skills with `/` (e.g. `/fix-ci`) or by describing the goal; use **ci-watcher** when waiting on or monitoring branch CI.

See `docs/TEAM_KIT.md` for full reference.
