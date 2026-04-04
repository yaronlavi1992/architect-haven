<script lang="ts">
  import { useConvexClient, useQuery } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import BuildingFormModal from "$lib/components/BuildingFormModal.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import UpgradeModal from "$lib/components/UpgradeModal.svelte";
  import { toast } from "$lib/toasts.svelte";
  import { getTotalFloors } from "$lib/utils";

  const client = useConvexClient();
  const buildingsQuery = useQuery(api.buildings.list, {});
  const subscriptionQuery = useQuery(api.subscriptions.getByUser, {});
  const plansQuery = useQuery(api.plans.get, {});

  let showCreateForm = $state(false);
  let showUpgradeModal = $state(false);
  let deleteTargetId = $state<string | null>(null);

  const freeLimit = $derived(plansQuery.data?.freeLimit ?? 5);
  const isPro = $derived(
    !!subscriptionQuery.data?.stripeCurrentPeriodEnd &&
      subscriptionQuery.data.stripeCurrentPeriodEnd * 1000 > Date.now(),
  );
  const atLimit = $derived(
    !!subscriptionQuery.data &&
      !isPro &&
      (buildingsQuery.data?.length ?? 0) >= freeLimit,
  );

  $effect(() => {
    if (deleteTargetId == null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        deleteTargetId = null;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  async function handleDeleteConfirm() {
    if (!deleteTargetId) return;

    try {
      await client.mutation(api.buildings.remove, { id: deleteTargetId as never });
      toast.success("Building deleted successfully");
      deleteTargetId = null;
    } catch {
      toast.error("Failed to delete building");
    }
  }
</script>

<div>
  <div class="mb-8 flex flex-col items-start justify-between sm:flex-row sm:items-center">
    <div>
      <h1 class="font-display mb-2 text-3xl font-bold text-gray-900">Your Buildings</h1>
      <p class="text-gray-600">Manage and view your 3D building models</p>
    </div>

    <button
      type="button"
      class="mt-4 self-center rounded-lg bg-green-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-600 sm:mt-0 sm:self-auto"
      onclick={() => (atLimit ? (showUpgradeModal = true) : (showCreateForm = true))}
    >
      Create Building
    </button>
  </div>

  {#if buildingsQuery.isLoading}
    <LoadingSpinner />
  {:else if !buildingsQuery.data || buildingsQuery.data.length === 0}
    <div class="py-12 text-center">
      <div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
        <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
      <h3 class="mb-2 text-lg font-semibold text-gray-900">No buildings yet</h3>
      <p class="mb-6 text-gray-600">Create your first 3D building model to get started</p>
      <button
        type="button"
        class="rounded-lg bg-green-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-600"
        onclick={() => (showCreateForm = true)}
      >
        Create Your First Building
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each buildingsQuery.data as building}
        <a
          href={`/buildings/${building._id}`}
          class="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md"
        >
          <div class="p-6">
            <div class="mb-4 flex items-start justify-between">
              <h3 class="truncate text-lg font-semibold text-gray-900">{building.name}</h3>
              <button
                type="button"
                class="text-red-500 transition-colors hover:text-red-700"
                aria-label={`Delete ${building.name}`}
                onclick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  deleteTargetId = building._id;
                }}
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
            </div>

            <div class="flex items-center text-gray-600">
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span class="text-sm">{getTotalFloors(building.sections)} floors</span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}

  {#if showCreateForm}
    <BuildingFormModal
      onClose={() => (showCreateForm = false)}
      onSuccess={() => {
        showCreateForm = false;
        toast.success("Building created successfully");
      }}
    />
  {/if}

  {#if deleteTargetId}
    <div class="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-black/50" aria-hidden="true" onclick={() => (deleteTargetId = null)}></div>
      <div class="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 class="font-display mb-2 text-lg font-semibold text-gray-900">Delete building?</h2>
        <p class="mb-6 text-gray-600">Are you sure you want to delete this building? This action cannot be undone.</p>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            onclick={() => (deleteTargetId = null)}
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            onclick={handleDeleteConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  {/if}

  <UpgradeModal open={showUpgradeModal} onClose={() => (showUpgradeModal = false)} plans={plansQuery.data} />
</div>
