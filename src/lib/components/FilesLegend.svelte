<script lang="ts">
  import type { FileLegendDocument } from "$lib/types";
  import { createUniqueLegendDocuments } from "$lib/utils";

  interface Props {
    documents: FileLegendDocument[];
    onDocumentClick: (document: FileLegendDocument) => void;
  }

  let { documents, onDocumentClick }: Props = $props();

  const uniqueDocuments = $derived(createUniqueLegendDocuments(documents ?? []));
</script>

{#if uniqueDocuments.length > 0}
  <div class="pointer-events-auto absolute bottom-4 left-4 z-20 max-w-xs rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
    <h4 class="mb-3 text-sm font-semibold text-gray-900">Files Legend</h4>

    <div class="grid grid-cols-1 gap-2">
      {#each uniqueDocuments as document}
        <button
          type="button"
          class="flex w-full items-center rounded p-2 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          onclick={() => onDocumentClick(document)}
        >
          <div
            class="mr-3 h-4 w-4 rounded border border-gray-300"
            style={`background-color: ${document.color}`}
          ></div>
          <svg class="mr-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span class="truncate text-sm text-gray-700">{document.name}</span>
        </button>
      {/each}
    </div>

    <p class="mt-3 text-xs text-gray-500">
      Click to select all apartments with this document
    </p>
  </div>
{/if}
