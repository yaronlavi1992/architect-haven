# Architect Haven Deployment

## Frontend

Vercel builds the SvelteKit app with the Vercel adapter. Set this variable in
the Production, Preview, and Development scopes:

- `PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud`

## Convex

Set Convex environment variables as needed:

- `HOSTING_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- auth provider secrets such as Google client credentials

Use `pnpm convex dev` for local development and `pnpm convex deploy` to deploy
backend changes. The frontend is deployed separately by Vercel.
