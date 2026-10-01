# Git

Code reaches `main` through a branch and a pull request. Mockup-only changes in `docs/mockups/` are committed on `main`. The ERP project tracker stays the work queue. GitHub Issues are not the board.

## Branch

Start from an up-to-date `main`.

| Field | What to put |
| --- | --- |
| Name | `port/<outcome>`, short enough to read in `git branch`. |
| Holds | One slice of the port. |
| Base | `main`. |

Do not commit application code directly on `main`.

## Commit

The subject is one sentence about why the change exists.

Pre-commit runs on `git commit`. If a hook edits files, stage those edits and commit again. Do not skip the hooks.

## Pull request

Open it into `main`. The title is the outcome. The body uses `.github/PULL_REQUEST_TEMPLATE.md`:

- **Summary** — what the branch changes, in one to three bullets.
- **Test plan** — the checks that show the slice works.

## Files that stay local

Do not commit `.env`, `.env.local`, `node_modules`, or `.next`. `.env.example` is committed.

## Example

**Branch:** `port/public-board`

**Commit subject:** A visitor can open the public list, role page, and apply form.

**Pull request title:** A visitor can open the public list, role page, and apply form.
