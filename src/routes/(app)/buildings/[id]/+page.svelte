<script lang="ts">
  import { page } from "$app/state";
  import { useConvexClient, useQuery } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import BuildingCanvas from "$lib/components/BuildingCanvas.svelte";
  import BuildingFormModal from "$lib/components/BuildingFormModal.svelte";
  import DocumentPanel from "$lib/components/DocumentPanel.svelte";
  import FilesLegend from "$lib/components/FilesLegend.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { toast } from "$lib/toasts.svelte";
  import { buildApartmentId, cloneBuilding, getSharedLegendDocuments, getTotalFloors } from "$lib/utils";
  import type { ApartmentDocument, BuildingRecord, FileLegendDocument } from "$lib/types";

  let { params } = $props<{ params: { id: string } }>();

  const client = useConvexClient();
  const buildingQuery = useQuery(api.buildings.get, () => ({ id: params.id as never }));
  const documentsQuery = useQuery(api.buildings.getDocuments, () => ({ buildingId: params.id as never }));

  let showEditForm = $state(false);
  let selectedApartments = $state(new Set<string>());
  let buildingData = $state<BuildingRecord | null>(null);
  let showMobilePanel = $state(false);

  $effect(() => {
    if (buildingQuery.data) {
      buildingData = cloneBuilding(buildingQuery.data);
    }
  });

  const currentBuilding = $derived(buildingData ?? buildingQuery.data ?? null);
  const hasAttachments = $derived(
    !!buildingQuery.data?.sections?.some((section) =>
      section.apartments?.some((apartment) => apartment.documents?.length > 0),
    ),
  );
  const viewOnlyUrl = $derived(
    buildingQuery.data?.shareToken ? `${page.url.origin}/view/${buildingQuery.data.shareToken}` : null,
  );
  const totalFloors = $derived(
    currentBuilding ? getTotalFloors(currentBuilding.sections) : 5,
  );
  const legendDocuments = $derived(getSharedLegendDocuments(currentBuilding));

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

  function handleClearSelection() {
    selectedApartments = new Set();
  }

  async function handleDocumentAssign(documentId: string) {
    if (!buildingData || selectedApartments.size === 0) return;

    const document = documentsQuery.data?.find((entry) => entry._id === documentId);
    if (!document) return;

    const updatedSections = buildingData.sections.map((section, sectionIndex) => ({
      ...section,
      apartments: section.apartments.map((apartment, apartmentIndex) => {
        let shouldUpdate = false;
        const floorCount = section.endFloor - section.startFloor + 1;

        for (let floorIndex = 0; floorIndex < floorCount; floorIndex += 1) {
          const apartmentId = buildApartmentId(sectionIndex, floorIndex, apartmentIndex);
          if (selectedApartments.has(apartmentId)) {
            shouldUpdate = true;
            break;
          }
        }

        if (!shouldUpdate) {
          return apartment;
        }

        return {
          ...apartment,
          documents: [
            ...apartment.documents,
            {
              name: document.name,
              color: document.color,
              signedUrl: document.url ?? undefined,
              storageId: document.storageId ?? undefined,
            },
          ],
        };
      }),
    }));

    try {
      await client.mutation(api.buildings.update, {
        id: buildingData._id as never,
        name: buildingData.name,
        sections: updatedSections,
      });

      buildingData = { ...buildingData, sections: updatedSections };
      selectedApartments = new Set();
      toast.success("Document assigned to selected apartments");
    } catch {
      toast.error("Failed to assign document");
    }
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
    if (!currentBuilding) return;

    const nextSelection = new Set<string>();

    currentBuilding.sections.forEach((section, sectionIndex) => {
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

  async function handleRemoveDocument(sectionIndex: number, apartmentIndex: number, documentIndex: number) {
    if (!buildingData) return;

    const updatedSections = buildingData.sections.map((section, currentSectionIndex) => {
      if (currentSectionIndex !== sectionIndex) return section;

      return {
        ...section,
        apartments: section.apartments.map((apartment, currentApartmentIndex) => {
          if (currentApartmentIndex !== apartmentIndex) return apartment;

          return {
            ...apartment,
            documents: apartment.documents.filter((_, currentDocumentIndex) => currentDocumentIndex !== documentIndex),
          };
        }),
      };
    });

    try {
      await client.mutation(api.buildings.update, {
        id: buildingData._id as never,
        name: buildingData.name,
        sections: updatedSections,
      });

      buildingData = { ...buildingData, sections: updatedSections };
      toast.success("Document removed");
    } catch {
      toast.error("Failed to remove document");
    }
  }

  async function handleCopyViewOnlyLink() {
    if (!buildingQuery.data) return;

    try {
      let token = buildingQuery.data.shareToken;
      if (!token) {
        token = await client.mutation(api.buildings.generateShareLink, {
          id: buildingQuery.data._id as never,
        });
      }

      await navigator.clipboard.writeText(`${page.url.origin}/view/${token}`);
      toast.success("View-only link copied to clipboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate link");
    }
  }

  async function handleRevokeViewOnlyLink() {
    if (!buildingQuery.data?.shareToken) return;

    try {
      await client.mutation(api.buildings.revokeShareLink, {
        id: buildingQuery.data._id as never,
      });
      toast.success("View-only link revoked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke");
    }
  }
</script>

{#if buildingQuery.isLoading}
  <LoadingSpinner />
{:else if !buildingQuery.data || !currentBuilding}
  <div class="py-12 text-center">
    <h2 class="mb-2 text-2xl font-bold text-gray-900">Building not found</h2>
    <p class="text-gray-600">The building you're looking for doesn't exist.</p>
  </div>
{:else}
  <div class="flex h-[calc(100vh-4rem)] min-h-0 flex-col">
    <div class="mb-6 flex flex-shrink-0 items-center justify-between">
      <div>
        <h1 class="font-display mb-2 text-3xl font-bold text-gray-900">{buildingQuery.data.name}</h1>
        <p class="text-gray-600">Interactive 3D building model</p>
      </div>
    </div>

    <div class="relative flex min-h-0 flex-1">
      <div class="relative min-h-0 w-full flex-1">
        <div class="h-full min-h-0 w-full overflow-hidden rounded-lg bg-blue-200">
          <BuildingCanvas
            building={currentBuilding}
            selectedApartments={selectedApartments}
            onApartmentClick={handleApartmentClick}
          />
        </div>

        {#if legendDocuments.length > 0}
          <FilesLegend documents={legendDocuments} onDocumentClick={handleDocumentLegendClick} />
        {/if}
      </div>

      <div class="absolute bottom-4 right-4 top-4 hidden w-80 md:block">
        <div class="h-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div class="space-y-6">
            <button
              type="button"
              class="w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
              onclick={() => (showEditForm = true)}
            >
              Edit Building
            </button>

            {#if hasAttachments}
              <div class="space-y-2">
                <button
                  type="button"
                  class="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-600"
                  onclick={handleCopyViewOnlyLink}
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  {viewOnlyUrl ? "Copy view-only link" : "Export view-only link"}
                </button>

                {#if viewOnlyUrl}
                  <button type="button" class="w-full text-sm text-gray-600 transition-colors hover:text-red-600" onclick={handleRevokeViewOnlyLink}>
                    Revoke link
                  </button>
                {/if}
              </div>
            {/if}

            {#if selectedApartments.size > 0}
              <button
                type="button"
                class="w-full rounded-lg bg-red-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-600"
                onclick={handleClearSelection}
              >
                Clear Selection ({selectedApartments.size})
              </button>
            {/if}

            {#if selectedApartments.size > 0}
              <DocumentPanel
                buildingId={params.id}
                selectedCount={selectedApartments.size}
                onDocumentAssign={handleDocumentAssign}
                buildingData={currentBuilding}
                selectedApartments={selectedApartments}
                onRemoveDocument={handleRemoveDocument}
              />
            {/if}
          </div>
        </div>
      </div>

      <button
        type="button"
        class="fixed right-4 top-1/2 z-10 rounded-full bg-amber-500 p-4 text-white shadow-lg transition-colors hover:bg-amber-600 md:hidden"
        aria-label="Open building controls"
        onclick={() => (showMobilePanel = true)}
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
          />
        </svg>
      </button>

      {#if showMobilePanel}
        <div class="fixed inset-0 z-50 flex items-end md:hidden">
          <button
            type="button"
            class="absolute inset-0 bg-black/50"
            aria-label="Close building controls"
            onclick={() => (showMobilePanel = false)}
          ></button>
          <div class="relative max-h-[80vh] w-full overflow-y-auto rounded-t-lg bg-white p-6">
            <div class="mb-6 flex items-center justify-between">
              <h3 class="text-lg font-semibold">Building Controls</h3>
              <button
                type="button"
                class="text-gray-500 transition-colors hover:text-gray-700"
                aria-label="Close building controls"
                onclick={() => (showMobilePanel = false)}
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="space-y-6">
              <button
                type="button"
                class="w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
                onclick={() => {
                  showMobilePanel = false;
                  showEditForm = true;
                }}
              >
                Edit Building
              </button>

              {#if hasAttachments}
                <div class="space-y-2">
                  <button
                    type="button"
                    class="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-600"
                    onclick={handleCopyViewOnlyLink}
                  >
                    {viewOnlyUrl ? "Copy view-only link" : "Export view-only link"}
                  </button>

                  {#if viewOnlyUrl}
                    <button type="button" class="w-full text-sm text-gray-600 transition-colors hover:text-red-600" onclick={handleRevokeViewOnlyLink}>
                      Revoke link
                    </button>
                  {/if}
                </div>
              {/if}

              {#if selectedApartments.size > 0}
                <button
                  type="button"
                  class="w-full rounded-lg bg-red-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-600"
                  onclick={handleClearSelection}
                >
                  Clear Selection ({selectedApartments.size})
                </button>
              {/if}

              {#if selectedApartments.size > 0}
                <DocumentPanel
                  buildingId={params.id}
                  selectedCount={selectedApartments.size}
                  onDocumentAssign={handleDocumentAssign}
                  buildingData={currentBuilding}
                  selectedApartments={selectedApartments}
                  onRemoveDocument={handleRemoveDocument}
                />
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  {#if showEditForm}
    <BuildingFormModal
      building={buildingQuery.data}
      onClose={() => (showEditForm = false)}
      onSuccess={() => {
        showEditForm = false;
        toast.success("Building updated successfully");
      }}
    />
  {/if}
{/if}
