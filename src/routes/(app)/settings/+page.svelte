<script lang="ts">
  import { useConvexClient, useQuery } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import { toast } from "$lib/toasts.svelte";

  const client = useConvexClient();
  const subscriptionQuery = useQuery(api.subscriptions.getByUser, {});
  const plansQuery = useQuery(api.plans.get, {});

  let loading = $state(false);

  const isPro = $derived(
    !!subscriptionQuery.data?.stripeCurrentPeriodEnd &&
      subscriptionQuery.data.stripeCurrentPeriodEnd * 1000 > Date.now(),
  );
  const plan = $derived(plansQuery.data?.plans?.[isPro ? "pro" : "free"]);
  const planFeatures = $derived(
    plan?.features ??
      (isPro
        ? ["Unlimited buildings", "3D visualization", "Document management"]
        : ["Up to 5 buildings", "3D visualization", "Document management"]),
  );

  async function handleManageSubscription() {
    loading = true;

    try {
      const url = await client.action(api.stripe.createCheckoutOrPortal, {});
      if (url) {
        window.location.href = url;
      } else {
        toast.error("No checkout URL returned");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open checkout");
    } finally {
      loading = false;
    }
  }
</script>

<div>
  <div class="mb-8">
    <h1 class="font-display mb-2 text-3xl font-bold text-gray-900">Settings</h1>
    <p class="text-gray-600">Manage your account and subscription</p>
  </div>

  <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h2 class="mb-4 text-xl font-semibold text-gray-900">Current Plan</h2>

    <div
      class={`flex items-center justify-between rounded-lg border p-4 ${
        isPro ? "border-indigo-200 bg-indigo-50" : "border-green-200 bg-green-50"
      }`}
    >
      <div>
        <h3 class={`font-semibold ${isPro ? "text-indigo-800" : "text-green-800"}`}>
          {plan?.name ?? (isPro ? "Pro Plan" : "Free Plan")}
        </h3>
        <p class={`text-sm ${isPro ? "text-indigo-600" : "text-green-600"}`}>
          {plan?.buildingLimit != null ? `Up to ${plan.buildingLimit} buildings` : "Unlimited buildings"}
        </p>
      </div>

      <div class="text-right">
        <div class={`text-2xl font-bold ${isPro ? "text-indigo-800" : "text-green-800"}`}>
          {plan?.priceDisplay ?? (isPro ? "$20" : "$0")}
        </div>
        <div class={`text-sm ${isPro ? "text-indigo-600" : "text-green-600"}`}>per month</div>
      </div>
    </div>

    <div class="mt-6">
      <h3 class="mb-3 font-semibold text-gray-900">Plan Features</h3>
      <ul class="space-y-2 text-gray-600">
        {#each planFeatures as feature}
          <li class="flex items-center">
            <svg class="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            {feature}
          </li>
        {/each}
      </ul>
    </div>

    <div class="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 class="mb-2 font-semibold text-blue-800">{isPro ? "Manage Subscription" : "Upgrade to Pro"}</h3>
      <p class="mb-3 text-sm text-blue-600">
        {isPro
          ? "Update payment method or cancel subscription"
          : `Get unlimited buildings for ${plansQuery.data?.proPriceDisplay ?? "$20"}/month`}
      </p>
      <button
        type="button"
        class="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        disabled={loading}
        onclick={handleManageSubscription}
      >
        {loading ? "Loading..." : isPro ? "Manage Billing" : "Upgrade to Pro"}
      </button>
    </div>
  </div>
</div>
