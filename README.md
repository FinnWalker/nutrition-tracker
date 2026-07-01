This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Local Postgres

Start the local development database with:

```bash
npm run db:start
```

The app's local database settings live in `.env`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nutrition_tracker?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/nutrition_tracker?schema=public
```

`DATABASE_URL` is used by the app at runtime. `DIRECT_URL` is used by Prisma CLI commands like migrations.

For production, set `DATABASE_URL` to your Neon pooled connection string and `DIRECT_URL` to your Neon direct connection string for Prisma migrations.

Useful local database commands:

```bash
npm run db:ps
npm run db:logs
npm run db:stop
npm run db:down
npm run db:generate
npm run db:migrate
npm run db:migrate:deploy
npm run db:studio
```

`npm run db:migrate` starts Prisma's development migration flow and will prompt for a migration name when you have schema changes.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
