<script lang="ts">
  import { useConvexClient } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import type { BuildingRecord, BuildingSection } from "$lib/types";
  import { toast } from "$lib/toasts.svelte";

  interface FloorGroup {
    startFloor: number;
    endFloor: number;
    apartmentsCount: number;
    description: string;
  }

  interface Props {
    building?: BuildingRecord | null;
    onClose: () => void;
    onSuccess: () => void;
  }

  let { building = null, onClose, onSuccess }: Props = $props();

  const client = useConvexClient();

  function sectionsToIndividualRows(sections: BuildingSection[]) {
    const sorted = [...sections].sort((a, b) => a.startFloor - b.startFloor);
    const rows: FloorGroup[] = [];

    for (const section of sorted) {
      for (let floor = section.startFloor; floor <= section.endFloor; floor += 1) {
        rows.push({
          startFloor: floor,
          endFloor: floor,
          apartmentsCount: section.apartmentsCount ?? section.apartments.length ?? 8,
          description: section.description ?? "offices",
        });
      }
    }

    return rows;
  }

  function createInitialFormState(source: BuildingRecord | null) {
    const sectionRows =
      source?.sections?.length && sectionsToIndividualRows(source.sections).length > 0
        ? sectionsToIndividualRows(source.sections)
        : [
            {
              startFloor: 1,
              endFloor: source ? 1 : 5,
              apartmentsCount: 8,
              description: "offices",
            },
          ];

    return {
      name: source?.name ?? "",
      sections: sectionRows,
    };
  }

  let name = $state("");
  let sections = $state<FloorGroup[]>([]);
  let isSubmitting = $state(false);

  $effect.pre(() => {
    if (sections.length > 0 || name) return;

    const initialFormState = createInitialFormState(building);
    name = initialFormState.name;
    sections = initialFormState.sections;
  });

  function addSection() {
    const lastSection = sections[sections.length - 1];
    const newStartFloor = lastSection ? lastSection.endFloor + 1 : 1;

    sections = [
      ...sections,
      {
        startFloor: newStartFloor,
        endFloor: building ? newStartFloor : newStartFloor + 1,
        apartmentsCount: 8,
        description: "offices",
      },
    ];
  }

  function removeSection(index: number) {
    if (sections.length <= 1) return;
    sections = sections.filter((_, currentIndex) => currentIndex !== index);
  }

  function updateSection(index: number, field: keyof FloorGroup, value: string | number) {
    const updated = sections.map((section) => ({ ...section }));
    updated[index] = { ...updated[index], [field]: value };

    if (building && (field === "startFloor" || field === "endFloor")) {
      const floor = typeof value === "number" ? value : parseInt(String(value), 10) || 1;
      updated[index].startFloor = Math.max(1, floor);
      updated[index].endFloor = Math.max(1, floor);
    }

    sections = updated;
  }

  function generateApartmentsForSection(section: FloorGroup, existingSection?: BuildingSection) {
    if (existingSection?.apartments) {
      const apartments = existingSection.apartments
        .slice(0, section.apartmentsCount)
        .map((apartment) => ({ ...apartment, isSelected: false }));

      while (apartments.length < section.apartmentsCount) {
        apartments.push({
          apartmentIndex: apartments.length,
          isSelected: false,
          type: "residential",
          documents: [],
        });
      }

      return apartments;
    }

    return Array.from({ length: section.apartmentsCount }, (_, index) => ({
      apartmentIndex: index,
      isSelected: false,
      type: "residential",
      documents: [],
    }));
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    isSubmitting = true;

    try {
      const expandedSections = [];
      const existingSections = building?.sections;

      for (const section of sections) {
        for (let floor = section.startFloor; floor <= section.endFloor; floor += 1) {
          const existingSection = existingSections?.find(
            (currentSection) => floor >= currentSection.startFloor && floor <= currentSection.endFloor,
          );

          expandedSections.push({
            startFloor: floor,
            endFloor: floor,
            apartmentsCount: section.apartmentsCount,
            description: section.description,
            apartments: generateApartmentsForSection(section, existingSection),
          });
        }
      }

      if (building) {
        await client.mutation(api.buildings.update, {
          id: building._id as never,
          name: name.trim(),
          sections: expandedSections,
        });
      } else {
        await client.mutation(api.buildings.create, {
          name: name.trim(),
          sections: expandedSections,
        });
      }

      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Free plan limited") || message.includes("Upgrade to Pro")) {
        const limit = message.match(/(\d+)\s+buildings/)?.[1] ?? "5";
        toast.error(`Free plan limit reached (${limit} buildings). Upgrade to Pro for unlimited.`);
      } else {
        toast.error(message);
      }
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
  <div class="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:p-6">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="font-display text-2xl font-bold text-gray-900">
        {building ? "Edit Building" : "Create New Building"}
      </h2>
      <button
        type="button"
        class="text-gray-500 transition-colors hover:text-gray-700"
        aria-label="Close building form"
        onclick={onClose}
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <form onsubmit={handleSubmit}>
      <div class="mb-6">
        <label class="mb-2 block text-sm font-medium text-gray-700" for="building-name">Building Name *</label>
        <input
          id="building-name"
          type="text"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="Enter building name"
          bind:value={name}
          required
        />
      </div>

      <div class="mb-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Floor Sections</h3>
          <button
            type="button"
            class="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            onclick={addSection}
          >
            Add Section
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full rounded-lg border border-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  {building ? "Floor" : "Floor Range"}
                </th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Apartments</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each sections as section, index}
                <tr>
                  <td class="px-4 py-3">
                    {#if building}
                      <input
                        type="number"
                        min={1}
                        class="w-16 rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        value={section.startFloor}
                        oninput={(event) =>
                          updateSection(index, "startFloor", parseInt((event.currentTarget as HTMLInputElement).value, 10) || 1)}
                      />
                    {:else}
                      <div class="flex items-center space-x-2">
                        <input
                          type="number"
                          min={1}
                          class="w-16 rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          value={section.startFloor}
                          oninput={(event) =>
                            updateSection(index, "startFloor", parseInt((event.currentTarget as HTMLInputElement).value, 10) || 1)}
                        />
                        <span class="text-gray-500">to</span>
                        <input
                          type="number"
                          min={section.startFloor}
                          class="w-16 rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          value={section.endFloor}
                          oninput={(event) =>
                            updateSection(index, "endFloor", parseInt((event.currentTarget as HTMLInputElement).value, 10) || 1)}
                        />
                      </div>
                    {/if}
                  </td>
                  <td class="px-4 py-3">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      class="w-20 rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      value={section.apartmentsCount}
                      oninput={(event) =>
                        updateSection(index, "apartmentsCount", parseInt((event.currentTarget as HTMLInputElement).value, 10) || 1)}
                    />
                  </td>
                  <td class="px-4 py-3">
                    <input
                      type="text"
                      class="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      placeholder="Section description"
                      value={section.description}
                      oninput={(event) => updateSection(index, "description", (event.currentTarget as HTMLInputElement).value)}
                    />
                  </td>
                  <td class="px-4 py-3">
                    {#if sections.length > 1}
                      <button
                        type="button"
                        class="text-red-500 transition-colors hover:text-red-700"
                        aria-label={`Remove floor section ${index + 1}`}
                        onclick={() => removeSection(index)}
                      >
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex justify-end space-x-4">
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          onclick={onClose}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="rounded-lg bg-green-500 px-6 py-2 font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting || !name.trim()}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  </div>
</div>
