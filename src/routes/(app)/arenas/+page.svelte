<script lang="ts">
  import { goto } from "$app/navigation";
  import { api } from "$convex/_generated/api";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { toast } from "$lib/toasts.svelte";
  import { useConvexClient, useQuery } from "convex-svelte";

  const client = useConvexClient();
  const arenas = useQuery(api.arenas.list, {});
  let showCreate = $state(false);
  let creating = $state(false);
  let name = $state("Neon Training Ground");
  let description = $state("A compact arena for spatial intelligence experiments.");
  let width = $state(12);
  let height = $state(10);

  async function createArena(event: SubmitEvent) {
    event.preventDefault();
    creating = true;
    try {
      const id = await client.mutation(api.arenas.create, { name: name.trim(), description: description.trim(), width, height });
      toast.success("Arena initialized");
      await goto(`/arenas/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create arena");
    } finally {
      creating = false;
    }
  }

  async function removeArena(id: string, arenaName: string) {
    if (!confirm(`Delete ${arenaName} and its run history?`)) return;
    await client.mutation(api.arenas.remove, { id: id as never });
    toast.success("Arena deleted");
  }
</script>

<div class="space-y-8">
  <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      <p class="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-violet-600">World laboratory</p>
      <h1 class="font-display text-4xl font-bold text-slate-950">Your arenas</h1>
      <p class="mt-2 max-w-2xl text-slate-600">Design worlds, deploy autonomous agents, and study what emerges.</p>
    </div>
    <button type="button" class="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-500" onclick={() => (showCreate = true)}>
      + New arena
    </button>
  </header>

  {#if arenas.isLoading}
    <LoadingSpinner />
  {:else if !arenas.data?.length}
    <button type="button" class="group flex min-h-80 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-violet-300 bg-gradient-to-br from-white to-violet-50 p-8 text-center transition hover:border-violet-500" onclick={() => (showCreate = true)}>
      <span class="mb-5 grid size-16 place-items-center rounded-2xl bg-violet-600 text-3xl text-white shadow-xl shadow-violet-200">✦</span>
      <span class="text-2xl font-bold text-slate-900">Create your first world</span>
      <span class="mt-2 max-w-md text-slate-600">Start with a grid, add terrain and agents, then run your first experiment.</span>
    </button>
  {:else}
    <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {#each arenas.data as arena}
        <article class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl">
          <a href={`/arenas/${arena._id}`} class="block">
            <div class="relative h-36 overflow-hidden bg-[#090d1a] p-5">
              <div class="absolute inset-0 opacity-40" style="background-image: linear-gradient(#7c3aed55 1px, transparent 1px), linear-gradient(90deg, #7c3aed55 1px, transparent 1px); background-size: 22px 22px;"></div>
              <div class="relative flex h-full items-center justify-center gap-3">
                {#each arena.agents.slice(0, 5) as agent}
                  <span class="size-8 rounded-full shadow-[0_0_24px_currentColor]" style={`background:${agent.color}; color:${agent.color}`}></span>
                {/each}
              </div>
              <span class="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-violet-100 backdrop-blur">{arena.width} × {arena.height}</span>
            </div>
            <div class="p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h2 class="text-xl font-bold text-slate-950">{arena.name}</h2>
                  <p class="mt-1 line-clamp-2 text-sm text-slate-600">{arena.description}</p>
                </div>
                <span class="rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">{arena.bestScore ?? 0} XP</span>
              </div>
              <div class="mt-5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span>{arena.agents.length} agents</span><span>{arena.cells.length} objects</span>
              </div>
            </div>
          </a>
          <div class="border-t border-slate-100 px-5 py-3 text-right">
            <button type="button" class="text-sm font-semibold text-slate-400 hover:text-red-600" onclick={() => removeArena(arena._id, arena.name)}>Delete</button>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

{#if showCreate}
  <div class="fixed inset-0 z-[200] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <form class="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl" onsubmit={createArena}>
      <div class="mb-6 flex items-start justify-between">
        <div><p class="text-xs font-bold uppercase tracking-widest text-violet-600">New experiment</p><h2 class="mt-1 text-2xl font-bold">Initialize arena</h2></div>
        <button type="button" aria-label="Close arena form" class="text-2xl text-slate-400" onclick={() => (showCreate = false)}>×</button>
      </div>
      <label class="mb-4 block text-sm font-semibold text-slate-700">Arena name<input aria-label="Arena name" class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-violet-500 focus:outline-none" bind:value={name} required /></label>
      <label class="mb-4 block text-sm font-semibold text-slate-700">Mission briefing<textarea aria-label="Mission briefing" class="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-violet-500 focus:outline-none" bind:value={description}></textarea></label>
      <div class="grid grid-cols-2 gap-4">
        <label class="text-sm font-semibold text-slate-700">Width<input aria-label="Arena width" type="number" min="6" max="24" class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" bind:value={width} /></label>
        <label class="text-sm font-semibold text-slate-700">Height<input aria-label="Arena height" type="number" min="6" max="24" class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" bind:value={height} /></label>
      </div>
      <div class="mt-7 flex justify-end gap-3"><button type="button" class="rounded-xl px-5 py-3 font-semibold text-slate-600" onclick={() => (showCreate = false)}>Cancel</button><button type="submit" disabled={creating} class="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white disabled:opacity-50">{creating ? "Initializing…" : "Enter world"}</button></div>
    </form>
  </div>
{/if}
