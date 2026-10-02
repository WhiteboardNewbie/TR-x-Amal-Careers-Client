# Git

Code reaches `main` through a branch and a pull request. Mockup-only changes in `docs/mockups/` are committed on `main`. The ERP project tracker stays the work queue. GitHub Issues are not the board.

## Branch

Start from an up-to-date `main`.

| Field | What to put |
| --- | --- |
| Name | `port/<outcome>`. The outcome is the commit subject, lowercased, with words joined by hyphens. Drop punctuation. |
| Holds | One slice of the port. |
| Base | `main`. |

Do not commit application code directly on `main`.

## Commit

The subject is one sentence about why the change exists, so `git log --oneline` stays readable. No type prefix, and no file list. A blank line follows, then the body:

- What a caller can do: the route, the status, and what comes back.
- What this commit leaves out, when it adds or closes a row in left-behind. Omit this part when nothing was left behind.
- How it was checked: the test command, or the cases that cover the change.

Pre-commit runs on `git commit`. If a hook edits files, stage those edits and commit again. Do not skip the hooks.

## Pull request

Open it into `main`. The title is the outcome sentence. The body uses `.github/PULL_REQUEST_TEMPLATE.md`. It is prose, the same three parts as the commit:

- What a caller can do: the route, the status, and what comes back.
- What this branch leaves out, when it adds or closes a row in left-behind. Omit this part when nothing was left behind.
- How it was checked: the test command, or the cases that cover the change.

## Files that stay local

Do not commit `.env`, `.env.local`, `node_modules`, or `.next`. `.env.example` is committed.

## Example

**Branch:** `port/the-client-can-call-the-four-public-routes`

**Commit:**

```text
The client can call the four public routes.

A typed client calls GET /careers/departments/, GET /careers/job-openings/, GET /careers/job-openings/{slug}/, and POST /careers/job-applications/. Anonymous lists are arrays. Apply 201 returns id, nested applicant, and status new. A 400 throws with the parsed body.

List, role, and apply UI stay out.

Checked with npx tsc --noEmit and npm run lint.
```

**Pull request title:** The client can call the four public routes.

**Pull request body:**

```text
A typed client calls GET /careers/departments/, GET /careers/job-openings/, GET /careers/job-openings/{slug}/, and POST /careers/job-applications/. Anonymous lists are arrays. Apply 201 returns id, nested applicant, and status new. A 400 throws with the parsed body.

List, role, and apply UI stay out.

Checked with npx tsc --noEmit and npm run lint.
```
