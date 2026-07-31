<script lang="ts">
  import { page } from "$app/state";
  import { api } from "$convex/_generated/api";
  import ArenaCanvas from "$lib/components/ArenaCanvas.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { createSimulation, frameScore, runSimulation, stepSimulation } from "$lib/simulation";
  import { toast } from "$lib/toasts.svelte";
  import type { ArenaAgent, ArenaRecord, BrainType, CellType, SimFrame } from "$lib/types";
  import { useConvexClient, useQuery } from "convex-svelte";

  let { params } = $props<{ params: { id: string } }>();
  const client = useConvexClient();
  const arenaQuery = useQuery(api.arenas.get, () => ({ id: params.id as never }));
  let arena = $state<ArenaRecord | null>(null);
  let mode = $state<"build" | "simulate">("build");
  let tool = $state<CellType | "erase" | "agent">("wall");
  let frames = $state<SimFrame[]>([]);
  let frameIndex = $state(0);
  let playing = $state(false);
  let selectedAgentId = $state<string | null>(null);
  let speed = $state(180);
  let saving = $state(false);
  let generation = $state(1);
  let evolutionLog = $state<Array<{ generation: number; score: number }>>([]);

  $effect(() => {
    if (arenaQuery.data && !arena) arena = structuredClone(arenaQuery.data) as ArenaRecord;
  });

  const currentFrame = $derived(frames[frameIndex] ?? null);
  const selectedAgent = $derived(currentFrame?.agents.find((agent) => agent.id === selectedAgentId) ?? null);
  const totalScore = $derived(currentFrame ? frameScore(currentFrame) : 0);

  $effect(() => {
    if (!playing || !arena || mode !== "simulate") return;
    const timer = window.setInterval(() => {
      if (frameIndex < frames.length - 1) {
        frameIndex += 1;
        return;
      }
      const latest = frames.at(-1);
      if (!latest || latest.tick >= 150 || !latest.agents.some((agent) => agent.alive)) {
        playing = false;
        return;
      }
      const next = stepSimulation(arena!, latest);
      frames = [...frames, next];
      frameIndex = frames.length - 1;
    }, speed);
    return () => window.clearInterval(timer);
  });

  function paintCell(x: number, z: number) {
    if (!arena || mode !== "build") return;
    const cells = arena.cells.filter((cell) => cell.x !== x || cell.z !== z);
    const agents = arena.agents.filter((agent) => agent.x !== x || agent.z !== z);
    if (tool === "agent") {
      const palette = ["#7c3aed", "#06b6d4", "#f97316", "#ec4899", "#84cc16"];
      const brains: BrainType[] = ["explorer", "collector", "survivor", "seeker"];
      agents.push({
        name: `Agent ${arena.agents.length + 1}`,
        color: palette[arena.agents.length % palette.length],
        brain: brains[arena.agents.length % brains.length],
        x,
        z,
      });
    } else if (tool !== "erase") cells.push({ x, z, type: tool });
    arena = { ...arena, cells, agents };
  }

  function removeAgent(index: number) {
    if (!arena) return;
    arena = { ...arena, agents: arena.agents.filter((_, current) => current !== index) };
  }

  function updateAgent(index: number, changes: Partial<ArenaAgent>) {
    if (!arena) return;
    arena = { ...arena, agents: arena.agents.map((agent, current) => current === index ? { ...agent, ...changes } : agent) };
  }

  async function saveArena() {
    if (!arena) return;
    saving = true;
    try {
      await client.mutation(api.arenas.update, {
        id: arena._id as never,
        name: arena.name,
        description: arena.description,
        width: arena.width,
        height: arena.height,
        cells: arena.cells,
        agents: arena.agents,
      });
      toast.success("World saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      saving = false;
    }
  }

  function enterSimulation() {
    if (!arena) return;
    frames = createSimulation(arena);
    frameIndex = 0;
    selectedAgentId = frames[0]?.agents[0]?.id ?? null;
    mode = "simulate";
  }

  async function finishRun() {
    if (!arena || !frames.length) return;
    const final = frames.at(-1)!;
    await client.mutation(api.arenas.recordRun, {
      arenaId: arena._id as never,
      score: frameScore(final),
      ticks: final.tick,
      survivors: final.agents.filter((agent) => agent.alive).length,
      generation,
    });
    toast.success(`Run recorded: ${frameScore(final)} XP`);
  }

  async function evolve() {
    if (!arena) return;
    playing = false;
    const brains: BrainType[] = ["explorer", "collector", "survivor", "seeker"];
    let champion = arena;
    let championFrames = runSimulation(arena, 90);
    let championScore = frameScore(championFrames.at(-1)!);
    for (let candidate = 0; candidate < 8; candidate += 1) {
      const mutated: ArenaRecord = {
        ...arena,
        agents: arena.agents.map((agent, index) => ({ ...agent, brain: brains[(candidate + index + generation) % brains.length] })),
      };
      const result = runSimulation(mutated, 90);
      const score = frameScore(result.at(-1)!);
      if (score > championScore) {
        champion = mutated;
        championFrames = result;
        championScore = score;
      }
    }
    generation += 1;
    evolutionLog = [...evolutionLog, { generation, score: championScore }].slice(-8);
    arena = champion;
    frames = championFrames;
    frameIndex = championFrames.length - 1;
    await saveArena();
    toast.success(`Generation ${generation} evolved to ${championScore} XP`);
  }

  async function shareArena() {
    if (!arena) return;
    const token = await client.mutation(api.arenas.createShareLink, { id: arena._id as never });
    await navigator.clipboard.writeText(`${page.url.origin}/spectate/${token}`);
    toast.success("Spectator link copied");
  }
</script>

{#if arenaQuery.isLoading || !arena}
  <LoadingSpinner />
{:else}
  <div class="-m-4 flex h-[calc(100vh-2rem)] min-h-[720px] flex-col overflow-hidden bg-[#070b18] text-white md:-m-8 md:h-screen">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0c1224] px-5 py-3">
      <div class="flex items-center gap-4"><a href="/arenas" class="text-slate-400 hover:text-white">← Arenas</a><div><input aria-label="Arena title" class="w-52 bg-transparent text-lg font-bold outline-none" bind:value={arena.name} /><p class="text-xs text-slate-500">Generation {generation} · {arena.width}×{arena.height} world</p></div></div>
      <div class="flex items-center gap-2">
        <div class="flex rounded-xl bg-white/5 p-1"><button type="button" class={`rounded-lg px-4 py-2 text-sm font-bold ${mode === "build" ? "bg-violet-600" : "text-slate-400"}`} onclick={() => { mode = "build"; playing = false; }}>Build</button><button type="button" class={`rounded-lg px-4 py-2 text-sm font-bold ${mode === "simulate" ? "bg-cyan-500 text-slate-950" : "text-slate-400"}`} onclick={enterSimulation}>Simulate</button></div>
        <button type="button" class="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10" onclick={shareArena}>Share</button>
        <button type="button" disabled={saving} class="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold hover:bg-violet-500" onclick={saveArena}>{saving ? "Saving…" : "Save world"}</button>
      </div>
    </header>

    <div class="flex min-h-0 flex-1">
      <aside class="w-56 flex-shrink-0 overflow-y-auto border-r border-white/10 bg-[#0c1224] p-4">
        {#if mode === "build"}
          <p class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">World brush</p>
          <div class="grid grid-cols-2 gap-2">
            {#each [["wall", "▰", "Wall"], ["food", "●", "Energy"], ["hazard", "◆", "Hazard"], ["goal", "✦", "Core"], ["agent", "◉", "Agent"], ["erase", "×", "Erase"]] as item}
              <button type="button" class={`rounded-xl border p-3 text-left transition ${tool === item[0] ? "border-violet-400 bg-violet-500/20" : "border-white/10 bg-white/[0.03] hover:bg-white/10"}`} onclick={() => (tool = item[0] as typeof tool)}><span class="block text-xl text-cyan-300">{item[1]}</span><span class="text-xs font-semibold">{item[2]}</span></button>
            {/each}
          </div>
          <p class="mt-4 text-xs leading-relaxed text-slate-500">Click tiles in the 3D world to paint. Drag to orbit, scroll to zoom.</p>
          <div class="mt-6 border-t border-white/10 pt-5"><p class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Mission briefing</p><textarea aria-label="Arena description" class="h-28 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300 outline-none focus:border-violet-400" bind:value={arena.description}></textarea></div>
        {:else}
          <p class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Run telemetry</p>
          <div class="space-y-3"><div class="rounded-xl bg-white/5 p-3"><span class="text-xs text-slate-500">Tick</span><strong class="block text-2xl text-cyan-300">{currentFrame?.tick ?? 0}</strong></div><div class="rounded-xl bg-white/5 p-3"><span class="text-xs text-slate-500">Team score</span><strong class="block text-2xl text-amber-300">{totalScore} XP</strong></div><div class="rounded-xl bg-white/5 p-3"><span class="text-xs text-slate-500">Online</span><strong class="block text-2xl text-emerald-300">{currentFrame?.agents.filter((agent) => agent.alive).length ?? 0}/{arena.agents.length}</strong></div></div>
          <button type="button" class="mt-4 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3 py-3 text-sm font-bold" onclick={evolve}>Evolve × 8</button>
          <button type="button" class="mt-2 w-full rounded-xl border border-white/10 px-3 py-3 text-sm font-bold" onclick={finishRun}>Record run</button>
          {#if evolutionLog.length}<div class="mt-5"><p class="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Evolution</p>{#each evolutionLog as result}<div class="flex justify-between border-b border-white/5 py-2 text-xs"><span>Gen {result.generation}</span><strong>{result.score} XP</strong></div>{/each}</div>{/if}
        {/if}
      </aside>

      <main class="relative min-w-0 flex-1">
        <ArenaCanvas {arena} frame={currentFrame} editable={mode === "build"} {selectedAgentId} onCellClick={paintCell} onAgentClick={(id) => (selectedAgentId = id)} />
        <div class="pointer-events-none absolute left-5 top-5 rounded-xl border border-white/10 bg-black/35 px-4 py-2 text-xs text-slate-300 backdrop-blur"><span class="mr-2 inline-block size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"></span>{mode === "build" ? "EDITOR ONLINE" : playing ? "SIMULATION LIVE" : "SIMULATION PAUSED"}</div>
        {#if mode === "simulate" && currentFrame}
          <div class="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-[#0c1224]/90 p-4 shadow-2xl backdrop-blur">
            <div class="flex items-center gap-4"><button type="button" aria-label={playing ? "Pause simulation" : "Play simulation"} class="grid size-11 place-items-center rounded-full bg-cyan-400 font-bold text-slate-950" onclick={() => (playing = !playing)}>{playing ? "Ⅱ" : "▶"}</button><span class="w-12 text-xs font-bold text-slate-400">{frameIndex}/{Math.max(frames.length - 1, 0)}</span><input aria-label="Replay timeline" type="range" min="0" max={Math.max(frames.length - 1, 0)} class="flex-1 accent-cyan-400" bind:value={frameIndex} oninput={() => (playing = false)} /><select aria-label="Simulation speed" class="rounded-lg bg-white/10 px-3 py-2 text-xs" bind:value={speed}><option value={360}>0.5×</option><option value={180}>1×</option><option value={80}>2×</option></select></div>
          </div>
        {/if}
      </main>

      <aside class="w-72 flex-shrink-0 overflow-y-auto border-l border-white/10 bg-[#0c1224] p-4">
        <p class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Agent roster</p>
        <div class="space-y-2">
          {#each arena.agents as agent, index}
            {@const runtime = currentFrame?.agents[index]}
            <div class={`w-full rounded-xl border p-3 text-left ${selectedAgentId === runtime?.id ? "border-cyan-400 bg-cyan-400/10" : "border-white/10 bg-white/[0.03]"}`} onclick={() => runtime && (selectedAgentId = runtime.id)} onkeydown={(event) => { if (event.key === "Enter" && runtime) selectedAgentId = runtime.id; }} role="button" tabindex="0">
              <div class="flex items-center gap-3"><span class="size-3 rounded-full shadow-[0_0_12px_currentColor]" style={`background:${agent.color};color:${agent.color}`}></span><input aria-label={`Agent ${index + 1} name`} class="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" value={agent.name} oninput={(event) => updateAgent(index, { name: event.currentTarget.value })} /><button type="button" aria-label={`Remove ${agent.name}`} class="text-slate-600 hover:text-red-400" onclick={(event) => { event.stopPropagation(); removeAgent(index); }}>×</button></div>
              <select aria-label={`${agent.name} brain`} class="mt-2 w-full rounded-lg bg-white/5 p-2 text-xs text-slate-300" value={agent.brain} onchange={(event) => updateAgent(index, { brain: event.currentTarget.value as BrainType })}><option value="explorer">Explorer</option><option value="collector">Collector</option><option value="survivor">Survivor</option><option value="seeker">Core seeker</option></select>
              {#if runtime}<div class="mt-3 grid grid-cols-2 gap-2 text-xs"><span class="text-slate-500">Energy <b class="text-white">{runtime.energy}</b></span><span class="text-slate-500">Score <b class="text-white">{runtime.score}</b></span></div>{/if}
            </div>
          {/each}
        </div>
        {#if selectedAgent}
          <div class="mt-5 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4"><p class="text-xs font-bold uppercase tracking-widest text-violet-300">Live cognition</p><p class="mt-3 text-sm leading-relaxed text-slate-200">“{selectedAgent.thought}”</p><div class="mt-4 text-xs text-slate-500">Position {selectedAgent.x}, {selectedAgent.z} · {Object.keys(selectedAgent.visits).length} cells mapped</div></div>
        {/if}
      </aside>
    </div>
  </div>
{/if}
