# WorkPilot — AI Operations Advisor for SMBs

WorkPilot helps service businesses discover what can be automated, augmented with AI, or optimized — with a practical rollout plan, budget, and ROI.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Clerk
- **AI:** OpenAI GPT-4o with structured outputs
- **Billing:** Stripe
- **Email:** Resend

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your keys
3. Install dependencies:

```bash
npm install
```

4. Start the local database and run migrations:

```bash
npx prisma dev
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
  app/
    (marketing)/    # Public pages (home, features, pricing, etc.)
    (app)/          # Authenticated app (dashboard, workflows, etc.)
    (auth)/         # Auth pages (sign-in, sign-up)
  components/       # Shared components
    ui/             # shadcn/ui primitives
  lib/              # Utilities and services
  hooks/            # Custom React hooks
prisma/
  schema.prisma     # Database schema
```
