# Client setup

Next.js App Router, TypeScript, and Tailwind.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app listens on http://localhost:3001 so it does not collide with the TeleRelation website on 3000. `NEXT_PUBLIC_API_URL` points at the careers API, default `http://localhost:8001`.

`/` is the public list: department pills, nine cards a page, and the empty messages. Cards open `/roles/[slug]`. A typed client in `lib/` calls the four public routes. The role and apply pages come next.

## Pre-commit

Install the [pre-commit](https://pre-commit.com/) tool, then install the hooks once in this repo:

```bash
pre-commit install
```

Commits then run the file checks and ESLint. Run them on the whole tree with `pre-commit run --all-files`.
