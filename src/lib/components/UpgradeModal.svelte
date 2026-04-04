<script lang="ts">
  import { useConvexClient } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import type { PlansPayload } from "$lib/types";
  import { toast } from "$lib/toasts.svelte";

  interface Props {
    open: boolean;
    onClose: () => void;
    plans?: PlansPayload;
  }

  let { open, onClose, plans }: Props = $props();

  const client = useConvexClient();
  let loading = $state(false);

  const freePlan = $derived(plans?.plans?.free);
  const proPlan = $derived(plans?.plans?.pro);

  async function handleUpgrade() {
    loading = true;

    try {
      const url = await client.action(api.stripe.createCheckoutOrPortal, {});
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Could not start checkout");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open checkout");
    } finally {
      loading = false;
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-[200] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="upgrade-modal-title"
    tabindex="-1"
  >
    <button
      type="button"
      class="absolute inset-0 bg-black/50"
      aria-label="Close upgrade modal"
      onclick={onClose}
    ></button>
    <div class="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
      <div class="mb-6 flex items-center justify-between">
        <h2 id="upgrade-modal-title" class="font-display text-xl font-bold text-gray-900">
          Upgrade to create more buildings
        </h2>
        <button
          type="button"
          class="p-1 text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Close upgrade modal"
          onclick={onClose}
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p class="mb-6 text-sm text-gray-600">
        You've reached the free plan limit ({plans?.freeLimit ?? 5} buildings). Upgrade to Pro for
        unlimited buildings.
      </p>

      <div class="mb-6 grid grid-cols-2 gap-4">
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 class="font-semibold text-gray-900">{freePlan?.name ?? "Free"}</h3>
          <p class="mt-1 text-2xl font-bold text-gray-700">{freePlan?.priceDisplay ?? "$0"}</p>
          <p class="mt-1 text-xs text-gray-500">per month</p>
          <ul class="mt-3 space-y-1 text-sm text-gray-600">
            {#each freePlan?.features ?? [] as feature}
              <li class="flex items-center gap-2">
                <span class="text-green-500">✓</span>
                {feature}
              </li>
            {/each}
          </ul>
        </div>

        <div class="rounded-lg border-2 border-indigo-500 bg-indigo-50/50 p-4">
          <h3 class="font-semibold text-indigo-900">{proPlan?.name ?? "Pro"}</h3>
          <p class="mt-1 text-2xl font-bold text-indigo-800">{proPlan?.priceDisplay ?? "$20"}</p>
          <p class="mt-1 text-xs text-indigo-600">per month</p>
          <ul class="mt-3 space-y-1 text-sm text-indigo-800">
            {#each proPlan?.features ?? [] as feature}
              <li class="flex items-center gap-2">
                <span class="text-indigo-500">✓</span>
                {feature}
              </li>
            {/each}
          </ul>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          type="button"
          class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          onclick={onClose}
        >
          Maybe later
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          disabled={loading}
          onclick={handleUpgrade}
        >
          {loading ? "Loading..." : "Upgrade to Pro"}
        </button>
      </div>
    </div>
  </div>
{/if}
