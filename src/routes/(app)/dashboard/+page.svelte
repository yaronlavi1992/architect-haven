<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "$convex/_generated/api";

  const userQuery = useQuery(api.auth.loggedInUser, {});
  const buildingsQuery = useQuery(api.buildings.list, {});
</script>

<div>
  <div class="mb-8">
    <h1 class="font-display mb-2 text-3xl font-bold text-gray-900">
      Welcome back, {userQuery.data?.name || userQuery.data?.email || "Architect"}!
    </h1>
    <p class="text-gray-600">Ready to create amazing 3D building models?</p>
  </div>

  <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    <a
      href="/buildings"
      class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div class="mb-4 flex items-center justify-between">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
          <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <span class="text-2xl font-bold text-gray-900">{buildingsQuery.data?.length || 0}</span>
      </div>

      <h3 class="mb-2 text-lg font-semibold text-gray-900">Buildings</h3>
      <p class="text-sm text-gray-600">Manage your 3D building models and documentation</p>
    </a>
  </div>
</div>
