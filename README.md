# Architect Haven

Architect Haven is a 3D building modeling application that utilizes SvelteKit 2 and Svelte 5, backed by Convex for data management.

## Structure

- Frontend: `src/routes`, `src/lib`, `src/app.css`
- Convex backend: `src/convex`

`npm run dev` starts the SvelteKit frontend and Convex dev server together.

## Convex

This app uses `convex-svelte` on the client and Convex Auth for password, Google, and anonymous sign-in.

The active Convex functions directory is configured in [convex.json](/C:/Users/yaron/Downloads/parent/architect_haven_-_3d_building_modeling_app/convex.json).

## Build

- `npm run check`
- `npm run build`
