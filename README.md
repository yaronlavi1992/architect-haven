# Architect Haven

Architect Haven is a 3D building modeling application that utilizes SvelteKit 2 and Svelte 5, backed by Convex for data management.

## Structure

- Frontend: `src/routes`, `src/lib`, `src/app.css`
- Convex backend: `src/convex`

Install the pinned Node.js and pnpm versions with `mise install`, then run
`pnpm install` and `pnpm dev`. The dev command starts the SvelteKit frontend
and Convex dev server together.

## Convex

This app uses `convex-svelte` on the client and Convex Auth for password, Google, and anonymous sign-in.

The active Convex functions directory is configured in `convex.json`.

## Build

- `pnpm check`
- `pnpm build`
