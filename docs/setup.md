# Client setup

Next.js App Router, TypeScript, and Tailwind.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app listens on http://localhost:3001 so it does not collide with the TeleRelation website on 3000. `NEXT_PUBLIC_API_URL` points at the careers API, default `http://localhost:8001`. Run the API on that port (see the API [setup.md](https://github.com/WhiteboardNewbie/TR-x-Amal-Careers-API/blob/main/docs/setup.md)); set `FRONTEND_URL=http://localhost:3001` on the API so invites and share links open this app.

`/` is the public list: department pills, nine cards a page, and the empty messages. Cards open `/roles/[slug]`; apply and thank-you live under that flow. `lib/` also covers sign-in, staff/reviews/client, assessment invites, and share links.

Candidate assessment order: first test (MCQ) → video (camera/mic) → free-text questionnaire → thank-you. The invite resumes at the first incomplete stage. Invalid/expired invite → 404/410 card. Video AI scoring runs on the API after all three are completed (scheduled when the questionnaire finishes), not in the browser.

Sign-in uses the API token `landing`: `staff` → `/staff`, `reviews` → `/reviews`, `client` → `/client`. Empty landing shows no Careers access. Org Config and Assessment database nav links only for `landing === "staff"`. `/reviews` accepts `reviews` or `staff` (Admin+Manager often land on staff but can open Reviews).

Careers tabs are permission-gated (`lib/ability.ts`): Roles → `careers.change_jobopening`; Applicants → `careers.view_applicant`; Job Applications + Stage Assignments → `careers.view_jobapplication`; Manage Applications → `careers.view_applicationstage`. Banner Create Role / Ideal Profile need `careers.add_jobopening`; Create Job Application needs `careers.add_jobapplication`. Hidden tabs do not render. Full group codes: API [permissions.md](https://github.com/WhiteboardNewbie/TR-x-Amal-Careers-API/blob/main/docs/permissions.md).

## Pre-commit

Install the [pre-commit](https://pre-commit.com/) tool, then install the hooks once in this repo:

```bash
pre-commit install
```

Commits then run the file checks and ESLint. Run them on the whole tree with `pre-commit run --all-files`.
