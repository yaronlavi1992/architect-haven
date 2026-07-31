# Emergence

Emergence is a spatial AI laboratory: users design 3D grid worlds, deploy autonomous agents, inspect their decisions, replay deterministic simulations, evolve strategies, and publish spectator links.

## Stack

- SvelteKit 2 and Svelte 5
- Three.js world rendering
- Convex persistence, realtime queries, and authentication
- Vercel deployment
- Playwright end-to-end tests

## Local development

```bash
mise install
pnpm install
pnpm dev
```

`pnpm dev` starts both the SvelteKit frontend and Convex development process. Use `pnpm check`, `pnpm build`, and `pnpm test:e2e` before deployment.

## Product areas

- `/arenas` — persistent world library
- `/arenas/:id` — 3D editor, simulator, replay, evolution, and live cognition
- `/leaderboard` — recorded tournament runs
- `/spectate/:token` — public realtime spectator experience
