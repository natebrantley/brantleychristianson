# Cursor Team Kit usage

This repo is configured to use every **Cursor Team Kit** plugin skill and the **ci-watcher** subagent. The agent is instructed via `AGENTS.md` and `.cursor/rules/team-kit.mdc` to invoke them when appropriate.

## Skills reference

| Skill | When to use | How we support it |
|-------|-------------|--------------------|
| **check-compiler-errors** | Before/with CI fixes; verify build/typecheck | `npm run typecheck`, `npm run build` |
| **deslop** | Clean up AI-generated or sloppy code | No extra setup |
| **fix-ci** | CI job failing; need to see logs and fix | `.github/workflows/ci.yml` |
| **fix-merge-conflicts** | Merge conflicts on branch | Git; workflow validates build + tests |
| **get-pr-comments** | Summarize review comments on active PR | GitHub PR context |
| **loop-on-ci** | Iterate until CI passes | Same as fix-ci |
| **new-branch-and-pr** | New branch + work + open PR | Git + GitHub |
| **pr-review-canvas** | Review a PR (paste URL or “review this PR”) | GitHub PR URL |
| **review-and-ship** | Full review, fix issues, ship via PR | Git + GitHub + CI |
| **run-smoke-tests** | Run or fix Playwright smoke tests | `npm run test:e2e`, `e2e/` |
| **weekly-review** | Weekly commit summary | Git history |
| **what-did-i-get-done** | Commit summary over a time range | Git history |

## Subagent

| Subagent | When to use |
|----------|-------------|
| **ci-watcher** | Waiting for CI; CI failed; proactively monitor branch CI |

## Plugin rules (automatic)

- **no-inline-imports** — Imports at top of file only.
- **typescript-exhaustive-switch** — Exhaustive switch for TypeScript unions/enums.

## How to invoke

- In Cursor chat: type `/` and pick a skill (e.g. `/fix-ci`, `/pr-review-canvas`), or describe the goal (“fix CI”, “review this PR”).
- The agent will also use skills when the task matches the table above (see `AGENTS.md`).

## Repo setup summary

- **.nvmrc** — Node version (used by CI and locally with `nvm use`).
- **README.md** — Project overview and link to this doc.
- **AGENTS.md** — Agent instructions: when to use each skill.
- **.cursor/rules/team-kit.mdc** — Always-on rule: prefer Team Kit skills for CI, PRs, shipping.
- **.github/workflows/ci.yml** — CI: typecheck, lint, build, then Playwright smoke tests (so fix-ci / loop-on-ci / ci-watcher have a real pipeline).
- **package.json** — `typecheck`, `test:e2e` scripts for check-compiler-errors and run-smoke-tests.
- **playwright.config.ts** + **e2e/smoke.spec.ts** — Minimal smoke tests for run-smoke-tests.
