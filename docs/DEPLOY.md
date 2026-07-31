# Deployment

## Vercel (frontend)

The GitHub repository is connected to the Vercel project and deploys from
`master`.

Build settings are committed in `vercel.json`:

- Install: `pnpm install --frozen-lockfile`
- Build: `pnpm build`
- Runtime adapter: `@sveltejs/adapter-vercel`

`PUBLIC_CONVEX_URL` must exist in Production, Preview, and Development. Keep
the Convex provider credentials and Stripe secrets in the Convex deployment,
not in client-visible Vercel variables.

After this, every push to `master` will trigger a production deployment.

## Convex (backend)

Deploy backend separately:

```bash
pnpm convex deploy
```

Use `mise install` to install the pinned Node.js and pnpm versions before
running deployment commands locally.
