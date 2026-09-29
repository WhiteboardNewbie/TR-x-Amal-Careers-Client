# Client setup

Next.js App Router, TypeScript, and Tailwind.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app listens on http://localhost:3000. `NEXT_PUBLIC_API_URL` points at the careers API, default `http://localhost:8000`.

The home page is a placeholder. The ported public routes will cover the job list, role detail, and apply form.
