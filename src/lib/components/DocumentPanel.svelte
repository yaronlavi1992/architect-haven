<script lang="ts">
  import { useConvexClient, useQuery } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import type { BuildingRecord } from "$lib/types";
  import { buildApartmentId } from "$lib/utils";
  import { toast } from "$lib/toasts.svelte";

  interface Props {
    buildingId: string;
    selectedCount: number;
    onDocumentAssign: (documentId: string) => void;
    buildingData: BuildingRecord;
    selectedApartments: Set<string>;
    onRemoveDocument: (sectionIndex: number, apartmentIndex: number, documentIndex: number) => void;
  }

  let {
    buildingId,
    selectedCount,
    onDocumentAssign,
    buildingData,
    selectedApartments,
    onRemoveDocument,
  }: Props = $props();

  const client = useConvexClient();
  const documentsQuery = useQuery(api.buildings.getDocuments, () => ({ buildingId: buildingId as never }));

  let isUploading = $state(false);
  let fileInput: HTMLInputElement | null = null;

  const selectedApartmentsByFloor = $derived.by(() => {
    const grouped: Record<
      string,
      Array<{
        sectionIndex: number;
        apartmentIndex: number;
        apartmentNumber: number;
        apartment: BuildingRecord["sections"][number]["apartments"][number];
      }>
    > = {};

    if (!buildingData) return grouped;

    buildingData.sections.forEach((section, sectionIndex) => {
      const floorCount = section.endFloor - section.startFloor + 1;

      for (let floorIndex = 0; floorIndex < floorCount; floorIndex += 1) {
        const floorNumber = section.startFloor + floorIndex;
        const floorKey = `Floor ${floorNumber}`;

        section.apartments.forEach((apartment, apartmentIndex) => {
          const apartmentId = buildApartmentId(sectionIndex, floorIndex, apartmentIndex);
          if (!selectedApartments.has(apartmentId)) return;

          if (!grouped[floorKey]) {
            grouped[floorKey] = [];
          }

          grouped[floorKey].push({
            sectionIndex,
            apartmentIndex,
            apartment,
            apartmentNumber: apartmentIndex + 1,
          });
        });
      }
    });

    return grouped;
  });

  async function handleFileUpload(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    isUploading = true;

    try {
      const postUrl = await client.mutation(api.buildings.generateUploadUrl, {});
      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(`Upload failed: ${JSON.stringify(json)}`);
      }

      await client.mutation(api.buildings.addDocument, {
        name: file.name,
        storageId: json.storageId,
        buildingId: buildingId as never,
      });

      toast.success("Document uploaded successfully");
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload document");
    } finally {
      isUploading = false;
    }
  }
</script>

<div class="space-y-6">
  <div>
    <h3 class="mb-2 text-lg font-semibold text-gray-900">Document Management</h3>
    <p class="text-sm text-gray-600">
      {selectedCount} apartment{selectedCount !== 1 ? "s" : ""} selected
    </p>
  </div>

  <div>
    <label class="mb-2 block text-sm font-medium text-gray-700" for="document-upload">Upload New Document</label>
    <input
      id="document-upload"
      bind:this={fileInput}
      type="file"
      class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
      disabled={isUploading}
      onchange={handleFileUpload}
    />

    {#if isUploading}
      <div class="mt-2 flex items-center text-sm text-blue-600">
        <div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
        Uploading...
      </div>
    {/if}
  </div>

  {#if documentsQuery.data && documentsQuery.data.length > 0}
    <div>
      <label class="mb-2 block text-sm font-medium text-gray-700" for="assign-document">Assign Existing Document</label>
      <select
        id="assign-document"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        onchange={(event) => {
          const select = event.currentTarget as HTMLSelectElement;
          if (select.value) {
            onDocumentAssign(select.value);
            select.value = "";
          }
        }}
      >
        <option value="">Select a document...</option>
        {#each documentsQuery.data as document}
          <option value={document._id}>{document.name}</option>
        {/each}
      </select>
    </div>
  {/if}

  {#if Object.keys(selectedApartmentsByFloor).length > 0}
    <div>
      <h4 class="mb-3 text-sm font-medium text-gray-700">Selected Apartments</h4>

      <div class="max-h-96 space-y-4 overflow-y-auto">
        {#each Object.entries(selectedApartmentsByFloor) as [floorKey, apartments]}
          <div class="rounded-lg border border-gray-200 p-3">
            <h5 class="mb-2 font-medium text-gray-900">{floorKey}</h5>

            <div class="space-y-2">
              {#each apartments as apartmentEntry}
                <div class="rounded bg-gray-50 p-2">
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-sm font-medium">Apartment {apartmentEntry.apartmentNumber}</span>
                  </div>

                  {#if apartmentEntry.apartment.documents && apartmentEntry.apartment.documents.length > 0}
                    <div class="space-y-1">
                      {#each apartmentEntry.apartment.documents as document, documentIndex}
                        <div class="flex items-center justify-between rounded bg-white p-2">
                          <div class="flex items-center">
                            <div
                              class="mr-2 h-3 w-3 rounded"
                              style={`background-color: ${document.color ?? "#999"}`}
                            ></div>
                            <span class="truncate text-xs text-gray-700">{document.name}</span>
                          </div>

                          <div class="flex items-center space-x-1">
                            {#if document.signedUrl}
                              <a
                                href={document.signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-xs text-blue-500 transition-colors hover:text-blue-700"
                              >
                                View
                              </a>
                            {/if}

                            <button
                              type="button"
                              class="text-red-500 transition-colors hover:text-red-700"
                              aria-label={`Remove ${document.name}`}
                              onclick={() =>
                                onRemoveDocument(
                                  apartmentEntry.sectionIndex,
                                  apartmentEntry.apartmentIndex,
                                  documentIndex,
                                )}
                            >
                              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <p class="text-xs text-gray-500">No documents attached</p>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
