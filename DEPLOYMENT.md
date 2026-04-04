# Architect Haven Deployment

## Frontend

Deploy the SvelteKit app to your chosen platform and set:

- `PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud`

## Convex

Set Convex environment variables as needed:

- `HOSTING_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- auth provider secrets such as Google client credentials

Use `npx convex dev` for local development and `npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name PUBLIC_CONVEX_URL` for production builds.
