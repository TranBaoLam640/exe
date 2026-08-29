# AGENTS.md — DoRentMe Repository Instructions

## 1. Purpose

These instructions apply to all Codex tasks performed in this repository.

Follow the user's current task as the primary source of scope.

Do not expand the task into unrelated refactoring, cleanup, redesign, architecture changes, or feature work unless explicitly requested.

Before modifying code, inspect the relevant existing implementation and preserve current project conventions unless the task explicitly requires changing them.

---

## 2. Task Execution Rules

For every implementation task:

1. Read the user's full request before editing.
2. Inspect the relevant files and surrounding dependencies.
3. Understand the existing behavior before changing it.
4. Make only changes required to complete the requested task.
5. Preserve existing behavior outside the requested scope.
6. Run appropriate validation after implementation.
7. Review the final diff before committing.
8. Commit the completed work.
9. Push the commit to the `main` branch.
10. Return a concise implementation report.

Do not stop after editing files if validation, commit, and push can still be completed.

---

## 3. Scope Discipline

Do not make unrelated changes.

In particular:

* Do not perform opportunistic refactors.
* Do not rename unrelated files, functions, variables, or directories.
* Do not reformat unrelated files.
* Do not upgrade dependencies unless required by the task.
* Do not change architecture merely because another design appears cleaner.
* Do not delete legacy code unless the task explicitly authorizes deletion.
* Do not silently change existing business behavior.
* Do not add features that were not requested.

If you discover an unrelated issue, report it in the final response instead of fixing it.

---

## 4. Preserve Existing Work

Before modifying files, inspect:

```bash
git status
```

Never discard unrelated existing work.

If the working tree already contains modifications:

* determine whether they belong to the current task;
* preserve unrelated user changes;
* do not use destructive commands that would erase them;
* do not include unrelated changes in the task commit.

Never use commands such as:

```bash
git reset --hard
git checkout -- .
git clean -fd
```

to remove existing work unless the user explicitly requests it.

Do not overwrite work merely to obtain a clean working tree.

---

## 5. Validation Requirements

Before considering an implementation complete, run the most relevant validation available for the affected project.

Examples include:

```bash
npm run build
npm run lint
npm test
```

or equivalent project-specific commands.

Use the repository's existing scripts when available.

If the task affects only part of the application, run focused tests where appropriate in addition to required project-level validation.

If a validation command fails because of your changes:

1. diagnose the failure;
2. fix it;
3. run the validation again.

Do not knowingly commit code with task-caused build or test failures.

If validation cannot be run because of an environment or infrastructure limitation, clearly report the limitation.

Do not claim that a test passed unless it was actually executed successfully.

---

## 6. Git Workflow

The default integration branch for this repository is:

```text
main
```

Do not create a new branch unless the user explicitly requests one.

Before committing, verify the current branch:

```bash
git branch --show-current
```

The completed task must ultimately be committed to `main`.

If currently on another branch and safely switching to `main` would risk losing or mixing existing work, do not destroy that work. Report the situation instead of performing a destructive operation.

---

## 7. Commit Requirement

For every task that modifies repository files, after implementation and validation:

```bash
git status
git diff
git diff --cached
```

Review the changes and ensure the commit contains only work relevant to the requested task.

Then stage the appropriate files and create a commit.

Use a concise Conventional Commit-style message whenever practical.

Examples:

```text
feat: establish React migration foundation
feat: migrate shop page to React
feat: move frontend assets to Cloudflare R2
fix: preserve cart state during React migration
refactor: isolate product catalog service
docs: update frontend migration instructions
```

Choose the commit type and message based on the actual task.

Do not use meaningless messages such as:

```text
update
changes
fix stuff
work
```

Do not amend or rewrite previous commits unless the user explicitly requests it.

---

## 8. Automatic Push Requirement

After a successful commit, automatically push the completed work to the remote `main` branch.

Normally use:

```bash
git push origin main
```

Do not wait for the user to separately ask for a push.

A task that modifies code is not considered fully completed until the push has been attempted.

If the local commit is on `main`, push it directly.

If credentials, network access, repository permissions, remote rejection, branch protection, or another external condition prevents the push:

* do not fake success;
* do not repeatedly perform destructive retries;
* keep the valid local commit;
* report the exact push failure in the final response.

---

## 9. Never Force Push

Never use:

```bash
git push --force
git push -f
git push --force-with-lease
```

unless the user explicitly requests a history rewrite and the consequences are understood.

Normal task completion must use a normal push.

If the remote `main` has commits that are not available locally, do not overwrite them.

Resolve the situation safely or report the blocker.

---

## 10. Remote Changes

Before pushing, if Git reports that `main` is behind or the push is rejected because the remote contains newer work:

* fetch the remote state;
* inspect the difference;
* integrate changes safely where possible;
* preserve both remote work and current task changes.

Do not overwrite remote work.

Do not resolve conflicts by blindly accepting one side.

If a conflict requires a business or architectural decision that cannot be safely inferred, stop and report the conflict.

---

## 11. Commit Only Completed Work

Do not commit merely because files were modified.

Commit only when:

* the requested implementation is complete;
* relevant validation has been performed;
* task-caused failures have been resolved;
* the final diff has been reviewed.

If the user's task is explicitly audit-only, review-only, investigation-only, or asks for no code modifications:

* do not create artificial repository changes;
* do not create an empty commit;
* do not push merely for the sake of pushing.

The automatic commit-and-push rule applies only when the task legitimately modifies repository files.

---

## 12. DoRentMe Migration Guardrails

The current migration scope is frontend-only.

Current migration target:

```text
Static HTML/CSS/JavaScript
        ->
Vite + React

Local image assets
        ->
Cloudflare R2
```

Unless explicitly requested by the user, do not expand frontend migration work into:

* ASP.NET Core implementation
* SQL Server integration
* Azure SQL integration
* database migrations
* VNPay
* MoMo
* backend redesign
* payment redesign
* Gemini backend redesign
* FASHN backend redesign

Preserve existing prototype functionality during migration.

---

## 13. Current Legacy Compatibility

Until the relevant migration phase explicitly changes them, preserve these existing frontend contracts.

### localStorage

```text
dorentme_users
dorentme_session
dorentme_cart
dorentme_orders
```

### sessionStorage

```text
dorentme_admin_ok
dorentme_tryon_count
```

Do not rename, delete, or silently change these data contracts without an explicit migration requirement.

---

## 14. Existing AI APIs

Existing serverless API routes include:

```text
/api/chat
/api/tryon
```

Do not expose server-side secrets to browser code.

Do not move:

```text
GEMINI_API_KEY
FASHN_API_KEY
```

into Vite `VITE_*` variables.

Variables prefixed with `VITE_` are frontend-visible and must be treated as public configuration.

Unless the task explicitly changes AI architecture, preserve the existing Gemini and FASHN serverless integration.

---

## 15. Frontend Migration Principles

During the HTML/JavaScript to React migration:

* preserve behavior before improving behavior;
* migrate incrementally;
* avoid copying large DOM-manipulation scripts directly into React;
* prefer React state, props, hooks, components, and services;
* avoid business logic inside `main.jsx`;
* avoid large business logic inside routing configuration;
* avoid direct `localStorage` access scattered through React components;
* create reusable abstractions where they materially support the current migration task;
* do not over-engineer speculative future architecture.

Do not redesign the site's visual appearance unless explicitly requested.

---

## 16. Cloudflare R2 Migration Principles

When the R2 migration phase begins:

* inventory assets before deleting anything;
* preserve a mapping between old local paths and new R2 object keys;
* verify uploads before replacing references;
* detect duplicate assets before unnecessary uploads;
* use environment-based public asset configuration;
* do not hard-code account-specific R2 URLs throughout components;
* do not delete local assets until migration verification is complete.

Prefer a public asset base configuration such as:

```text
VITE_ASSET_BASE_URL
```

combined with a centralized asset URL helper.

Actual bucket, domain, CORS, cache, and key structure must follow the specific migration task rather than being guessed in advance.

---

## 17. Security Rules

Never commit:

* passwords
* API keys
* access tokens
* Cloudflare credentials
* `.env` secrets
* private keys
* authentication cookies
* service credentials

Check staged changes before committing.

If secrets are discovered in existing code, report them.

Do not expose existing secrets in the final report.

---

## 18. Final Git Verification

After committing and pushing, verify repository state.

At minimum inspect:

```bash
git status
git log -1 --oneline
```

When useful, verify local and remote branch state.

The final worktree should be clean with respect to changes created by the current task.

Existing unrelated user changes may remain and must be explicitly reported rather than destroyed.

---

## 19. Required Final Response

For implementation tasks, finish with a concise report containing:

### Completed

Summarize what was implemented.

### Validation

List the validation commands actually run and their results.

### Git

Report:

```text
Branch:
Commit:
Commit message:
Push:
Working tree:
```

### Notes

Mention only relevant warnings, limitations, deviations, or follow-up issues.

Do not say the task is fully complete if the required implementation or validation failed.

Do not claim the push succeeded unless Git confirmed it.

---

## 20. Priority of Instructions

Follow instructions in this order:

1. System/platform constraints.
2. The user's current explicit request.
3. More specific repository instructions from applicable nested `AGENTS.md` files.
4. This root `AGENTS.md`.
5. Existing repository conventions.

If the current user request explicitly overrides a rule in this file, follow the user's current request when it is safe and technically possible.
