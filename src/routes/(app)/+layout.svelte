<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { auth } from "$lib/auth.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";

  const STORAGE_KEY = "architect-haven-sidebar-collapsed";

  const { children } = $props();

  let collapsed = $state(false);

  onMount(() => {
    collapsed = window.localStorage.getItem(STORAGE_KEY) === "true";
  });

  $effect(() => {
    if (browser) {
      window.localStorage.setItem(STORAGE_KEY, String(collapsed));
    }
  });

  $effect(() => {
    if (auth.initialized && !auth.isLoading && !auth.isAuthenticated) {
      goto("/auth", { replaceState: true });
    }
  });
</script>

{#if !auth.initialized || auth.isLoading}
  <LoadingSpinner fullScreen />
{:else if auth.isAuthenticated}
  <div class="flex h-screen bg-gray-50 md:gap-3">
    <Sidebar collapsed={collapsed} onToggle={() => (collapsed = !collapsed)} />

    <main class={`min-h-0 min-w-0 flex-1 overflow-auto p-4 pl-12 md:p-8 ${collapsed ? "md:pl-12" : "md:pl-0"}`}>
      <div class="mx-auto min-w-0 max-w-6xl">
        {@render children()}
      </div>
    </main>
  </div>
{:else}
  <LoadingSpinner fullScreen />
{/if}
