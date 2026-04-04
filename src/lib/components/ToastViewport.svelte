<script lang="ts">
  import { toast } from "$lib/toasts.svelte";

  function toneClasses(tone: "success" | "error" | "info") {
    switch (tone) {
      case "success":
        return "border-green-200 bg-green-50 text-green-800";
      case "error":
        return "border-red-200 bg-red-50 text-red-800";
      default:
        return "border-blue-200 bg-blue-50 text-blue-800";
    }
  }
</script>

<div class="pointer-events-none fixed inset-x-0 top-4 z-[300] flex flex-col items-center gap-3 px-4">
  {#each toast.entries as entry (entry.id)}
    <div
      class={`pointer-events-auto flex w-full max-w-md items-center justify-between rounded-lg border px-4 py-3 shadow-lg ${toneClasses(entry.tone)}`}
    >
      <p class="text-sm font-medium">{entry.message}</p>
      <button
        type="button"
        class="ml-4 text-xs font-semibold uppercase tracking-wide opacity-70 transition-opacity hover:opacity-100"
        onclick={() => toast.remove(entry.id)}
      >
        Close
      </button>
    </div>
  {/each}
</div>
