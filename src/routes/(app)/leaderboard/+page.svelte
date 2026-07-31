<script lang="ts">
  import { api } from "$convex/_generated/api";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { useQuery } from "convex-svelte";
  const leaderboard = useQuery(api.arenas.leaderboard, {});
</script>

<div class="mx-auto max-w-5xl space-y-8">
  <header><p class="text-xs font-bold uppercase tracking-[0.28em] text-fuchsia-600">Global experiments</p><h1 class="mt-2 font-display text-4xl font-bold text-slate-950">Hall of emergence</h1><p class="mt-2 text-slate-600">The strongest agent teams across every published run.</p></header>
  {#if leaderboard.isLoading}<LoadingSpinner />{:else}
    <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
      <div class="grid grid-cols-[64px_1fr_1fr_100px_100px] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400"><span>Rank</span><span>Arena</span><span>Trainer</span><span>Agents</span><span>Score</span></div>
      {#each leaderboard.data ?? [] as run, index}
        <div class="grid grid-cols-[64px_1fr_1fr_100px_100px] items-center gap-4 border-b border-slate-100 px-6 py-5 last:border-0"><span class={`text-xl font-black ${index < 3 ? "text-violet-600" : "text-slate-300"}`}>#{index + 1}</span><div><strong class="text-slate-950">{run.arenaName}</strong><p class="text-xs text-slate-400">Generation {run.generation} · {run.ticks} ticks</p></div><span class="text-sm text-slate-600">{run.playerName}</span><span class="text-sm font-semibold text-emerald-600">{run.survivors} online</span><strong class="text-lg text-amber-600">{run.score} XP</strong></div>
      {:else}<div class="p-16 text-center text-slate-500">No recorded runs yet. Enter an arena and set the first benchmark.</div>{/each}
    </div>
  {/if}
</div>
