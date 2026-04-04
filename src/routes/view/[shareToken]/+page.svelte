<script lang="ts">
  import BuildingCanvas from "$lib/components/BuildingCanvas.svelte";
  import FilesLegend from "$lib/components/FilesLegend.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { buildApartmentId, getSharedLegendDocuments } from "$lib/utils";
  import { useQuery } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import type { ApartmentDocument, FileLegendDocument } from "$lib/types";
  import { getSharedBuilding } from "./building.remote";

  let { params } = $props<{ params: { shareToken: string } }>();

  const initialBuilding = $derived(await getSharedBuilding(params.shareToken));
  const buildingQuery = useQuery(
    api.buildings.getByShareToken,
    () => ({ shareToken: params.shareToken }),
    () => ({ initialData: initialBuilding ?? undefined, keepPreviousData: true }),
  );

  let selectedApartments = $state(new Set<string>());

  const building = $derived(buildingQuery.data ?? initialBuilding ?? null);
  const legendDocuments = $derived(getSharedLegendDocuments(building));
  const selectedDocumentsWithUrls = $derived.by(() => {
    if (!building || selectedApartments.size === 0) return [];

    const documents: Array<{ name: string; signedUrl: string }> = [];
    const seen = new Set<string>();

    selectedApartments.forEach((id) => {
      const [sectionIndex, , apartmentIndex] = id.split("-").map(Number);
      const apartment = building.sections[sectionIndex]?.apartments?.[apartmentIndex];

      apartment?.documents.forEach((document) => {
        if (document.signedUrl && !seen.has(document.signedUrl)) {
          seen.add(document.signedUrl);
          documents.push({ name: document.name, signedUrl: document.signedUrl });
        }
      });
    });

    return documents;
  });

  function handleApartmentClick(sectionIndex: number, floorIndex: number, apartmentIndex: number) {
    const apartmentId = buildApartmentId(sectionIndex, floorIndex, apartmentIndex);
    const nextSelection = new Set(selectedApartments);

    if (nextSelection.has(apartmentId)) {
      nextSelection.delete(apartmentId);
    } else {
      nextSelection.add(apartmentId);
    }

    selectedApartments = nextSelection;
  }

  function documentMatchesLegendDocument(
    apartmentDocument: ApartmentDocument,
    legendDocument: FileLegendDocument,
  ) {
    if (apartmentDocument.name !== legendDocument.name) return false;
    if (!legendDocument.color) return true;
    return apartmentDocument.color === legendDocument.color;
  }

  function handleDocumentLegendClick(legendDocument: FileLegendDocument) {
    if (!building) return;

    const nextSelection = new Set<string>();

    building.sections.forEach((section, sectionIndex) => {
      const floorCount = section.endFloor - section.startFloor + 1;

      section.apartments.forEach((apartment, apartmentIndex) => {
        if (
          apartment.documents.some((document) => documentMatchesLegendDocument(document, legendDocument))
        ) {
          for (let floorIndex = 0; floorIndex < floorCount; floorIndex += 1) {
            nextSelection.add(buildApartmentId(sectionIndex, floorIndex, apartmentIndex));
          }
        }
      });
    });

    selectedApartments = nextSelection;
  }
</script>

{#if buildingQuery.isLoading && !building}
  <LoadingSpinner fullScreen />
{:else if !building}
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
    <h2 class="mb-2 text-2xl font-bold text-gray-900">Link invalid or expired</h2>
    <p class="mb-6 text-gray-600">This view-only link may have been revoked.</p>
    <a href="/" class="text-blue-600 hover:underline">Go home</a>
  </div>
{:else}
  <div class="flex min-h-screen flex-col bg-gray-50">
    <div class="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white p-4">
      <div>
        <h1 class="font-display text-xl font-bold text-gray-900">{building.name}</h1>
        <p class="text-sm text-gray-500">View only · attachments visible</p>
      </div>
      <a href="/" class="text-sm text-gray-600 transition-colors hover:text-gray-900">Architect Haven</a>
    </div>

    <div class="relative flex min-h-0 flex-1">
      <div class="relative min-h-0 w-full flex-1">
        <div class="h-full min-h-0 w-full bg-blue-200">
          <BuildingCanvas
            building={building}
            selectedApartments={selectedApartments}
            onApartmentClick={handleApartmentClick}
          />
        </div>

        {#if legendDocuments.length > 0}
          <FilesLegend documents={legendDocuments} onDocumentClick={handleDocumentLegendClick} />
        {/if}
      </div>

      {#if selectedApartments.size > 0}
        <div class="absolute right-4 top-4 z-10 max-h-[60vh] w-80 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <div class="mb-3 flex items-center justify-between">
            <span class="font-semibold text-gray-900">Documents on selected apartments</span>
            <button type="button" class="text-sm text-gray-500 transition-colors hover:text-gray-700" onclick={() => (selectedApartments = new Set())}>
              Clear
            </button>
          </div>

          <ul class="space-y-2">
            {#each selectedDocumentsWithUrls as document}
              <li>
                <a
                  href={document.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span class="truncate">{document.name}</span>
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  </div>
{/if}
