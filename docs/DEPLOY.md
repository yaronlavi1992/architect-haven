# Deployment

## Vercel (frontend)

Pushes to GitHub do **not** deploy automatically until the repo is connected in Vercel and the production branch matches.

1. **Connect the repo**
   - [Vercel Dashboard](https://vercel.com/dashboard) → Add New → Project → Import `yaronlavi1992/architect-haven-vite`.
   - Authorize GitHub if prompted.

2. **Set production branch to `master`**
   - This repo uses `master`, not `main`. In the project: **Settings → Git → Production Branch** → choose **master** (or type it).
   - Otherwise pushes to `master` only create previews and production never updates.

3. **Build settings** (usually auto-detected)
   - Build Command: `npm run build` or `vite build`
   - Output Directory: `dist`
   - Install Command: `npm install` (or `bun install` if you use Bun)

After this, every push to `master` will trigger a production deployment.

## Convex (backend)

Deploy backend separately:

```bash
npx convex deploy
```

## Optional: GitHub Actions CI

The repo includes a workflow (`.github/workflows/ci.yml`) that runs build on push to `master`. This verifies the app builds; it does not replace Vercel. Deploys are still done by Vercel’s Git integration once the project is connected.
