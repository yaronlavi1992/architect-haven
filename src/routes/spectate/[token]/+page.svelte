<script lang="ts">
  import { api } from "$convex/_generated/api";
  import ArenaCanvas from "$lib/components/ArenaCanvas.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { createSimulation, frameScore, stepSimulation } from "$lib/simulation";
  import type { ArenaRecord, SimFrame } from "$lib/types";
  import { useQuery } from "convex-svelte";
  let { params } = $props<{ params: { token: string } }>();
  const query = useQuery(api.arenas.getShared, () => ({ token: params.token }));
  let frames = $state<SimFrame[]>([]);
  let frameIndex = $state(0);
  let playing = $state(true);
  let initialized = $state(false);
  const arena = $derived((query.data ?? null) as ArenaRecord | null);
  const frame = $derived(frames[frameIndex] ?? null);
  $effect(() => {
    if (arena && !initialized) { frames = createSimulation(arena); initialized = true; }
  });
  $effect(() => {
    if (!playing || !arena || !frame) return;
    const timer = setInterval(() => {
      if (frameIndex < frames.length - 1) frameIndex += 1;
      else if (frames.at(-1)!.tick < 150 && frames.at(-1)!.agents.some((agent) => agent.alive)) {
        frames = [...frames, stepSimulation(arena, frames.at(-1)!)]; frameIndex = frames.length - 1;
      } else playing = false;
    }, 180);
    return () => clearInterval(timer);
  });
</script>

{#if query.isLoading}<LoadingSpinner fullScreen />{:else if !arena}<div class="grid min-h-screen place-items-center bg-slate-950 text-white"><div class="text-center"><h1 class="text-3xl font-bold">Signal lost</h1><p class="mt-2 text-slate-400">This spectator link is invalid.</p></div></div>{:else}
  <div class="flex h-screen flex-col bg-[#070b18] text-white">
    <header class="flex items-center justify-between border-b border-white/10 bg-[#0c1224] px-6 py-4"><div><p class="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">Emergence live</p><h1 class="text-xl font-bold">{arena.name}</h1></div><div class="flex gap-6 text-center"><div><strong class="block text-xl text-amber-300">{frame ? frameScore(frame) : 0}</strong><span class="text-xs text-slate-500">TEAM XP</span></div><div><strong class="block text-xl text-emerald-300">{frame?.agents.filter((agent) => agent.alive).length ?? 0}</strong><span class="text-xs text-slate-500">ONLINE</span></div></div><a href="/" class="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold">Build your world</a></header>
    <main class="relative min-h-0 flex-1"><ArenaCanvas {arena} {frame} /><div class="absolute inset-x-6 bottom-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0c1224]/90 p-4 backdrop-blur"><button type="button" class="grid size-11 place-items-center rounded-full bg-cyan-400 font-bold text-slate-950" onclick={() => (playing = !playing)}>{playing ? "Ⅱ" : "▶"}</button><input aria-label="Spectator timeline" type="range" min="0" max={Math.max(frames.length - 1, 0)} class="flex-1 accent-cyan-400" bind:value={frameIndex} oninput={() => (playing = false)} /><span class="text-sm font-bold text-slate-400">T+{frame?.tick ?? 0}</span></div></main>
  </div>
{/if}
