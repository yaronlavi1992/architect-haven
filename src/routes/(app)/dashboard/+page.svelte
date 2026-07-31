<script lang="ts">
  import { api } from "$convex/_generated/api";
  import { useQuery } from "convex-svelte";
  const user = useQuery(api.auth.loggedInUser, {});
  const arenas = useQuery(api.arenas.list, {});
  const leaderboard = useQuery(api.arenas.leaderboard, {});
  const best = $derived(Math.max(0, ...(arenas.data ?? []).map((arena) => arena.bestScore ?? 0)));
</script>

<div class="space-y-8">
  <header class="relative overflow-hidden rounded-3xl bg-[#0b1020] p-8 text-white shadow-2xl md:p-10">
    <div class="absolute inset-0 opacity-40" style="background: radial-gradient(circle at 80% 20%, #7c3aed 0, transparent 35%), radial-gradient(circle at 60% 100%, #0891b2 0, transparent 30%);"></div>
    <div class="relative max-w-2xl"><p class="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Command center online</p><h1 class="mt-3 font-display text-4xl font-bold md:text-5xl">Welcome back, {user.data?.name || user.data?.email || "Trainer"}.</h1><p class="mt-4 text-lg text-slate-300">Build a world. Give agents a mind. Press play and discover what they become.</p><a href="/arenas" class="mt-7 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-bold shadow-lg shadow-violet-950 transition hover:-translate-y-0.5 hover:bg-violet-500">Enter the world lab →</a></div>
  </header>

  <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {#each [["Arenas", arenas.data?.length ?? 0, "text-violet-600", "bg-violet-50"], ["Agents", (arenas.data ?? []).reduce((sum, arena) => sum + arena.agents.length, 0), "text-cyan-600", "bg-cyan-50"], ["Personal best", `${best} XP`, "text-amber-600", "bg-amber-50"], ["Global runs", leaderboard.data?.length ?? 0, "text-fuchsia-600", "bg-fuchsia-50"]] as metric}
      <div class={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm`}><div class={`mb-4 grid size-10 place-items-center rounded-xl ${metric[3]} ${metric[2]}`}>✦</div><strong class="text-3xl font-black text-slate-950">{metric[1]}</strong><p class="mt-1 text-sm font-semibold text-slate-500">{metric[0]}</p></div>
    {/each}
  </section>

  <section><div class="mb-4 flex items-center justify-between"><div><h2 class="text-2xl font-bold text-slate-950">Recent worlds</h2><p class="text-sm text-slate-500">Continue an experiment or launch a new one.</p></div><a href="/arenas" class="text-sm font-bold text-violet-600">View all →</a></div><div class="grid gap-4 md:grid-cols-3">{#each (arenas.data ?? []).slice(0, 3) as arena}<a href={`/arenas/${arena._id}`} class="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg"><div class="mb-5 h-24 rounded-xl bg-[#0b1020] p-4"><div class="flex h-full items-center justify-center gap-2">{#each arena.agents as agent}<span class="size-5 rounded-full shadow-[0_0_16px_currentColor]" style={`background:${agent.color};color:${agent.color}`}></span>{/each}</div></div><h3 class="font-bold text-slate-950">{arena.name}</h3><p class="mt-1 text-sm text-slate-500">{arena.agents.length} agents · {arena.bestScore ?? 0} XP</p></a>{:else}<a href="/arenas" class="col-span-full rounded-2xl border border-dashed border-violet-300 bg-violet-50 p-10 text-center font-bold text-violet-700">+ Initialize your first arena</a>{/each}</div></section>
</div>
