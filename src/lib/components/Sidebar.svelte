<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { PanelLeft } from "lucide-svelte";
  import { auth } from "$lib/auth.svelte";

  interface Props {
    collapsed: boolean;
    onToggle: () => void;
  }

  let { collapsed, onToggle }: Props = $props();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Buildings", href: "/buildings", icon: "buildings" },
    { name: "Settings", href: "/settings", icon: "settings" },
  ];

  let drawerOpen = $state(false);
  let isDesktop = $state(true);

  const topSafeOffset = "top-[max(0.5rem,env(safe-area-inset-top,0px))]";

  function updateDesktopState(mediaQuery: MediaQueryList) {
    isDesktop = mediaQuery.matches;
    if (isDesktop) {
      drawerOpen = false;
    }
  }

  onMount(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    updateDesktopState(mediaQuery);

    const handleChange = () => updateDesktopState(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  });

  const pathname = $derived(page.url.pathname);
  const sidebarVisible = $derived(isDesktop ? !collapsed : drawerOpen);

  function handleToggle() {
    if (isDesktop) {
      onToggle();
    } else {
      drawerOpen = !drawerOpen;
    }
  }

  function closeDrawer() {
    if (!isDesktop) {
      drawerOpen = false;
    }
  }

  function linkClasses(active: boolean) {
    return active
      ? "flex items-center rounded-lg bg-blue-600 px-4 py-3 text-white transition-colors"
      : "flex items-center rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white";
  }

  function iconMarkup(name: string) {
    switch (name) {
      case "dashboard":
        return [
          "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z",
          "M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z",
        ];
      case "buildings":
        return [
          "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        ];
      case "settings":
        return [
          "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065",
          "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        ];
      default:
        return [];
    }
  }
</script>

<div
  class={`pointer-events-auto fixed left-2 ${topSafeOffset} z-[100] flex flex-row gap-0.5 rounded-lg border border-gray-700/50 bg-[#111827]/90 p-1 backdrop-blur-sm`}
>
  <button
    type="button"
    class="inline-flex size-8 flex-shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-700/80 hover:text-white"
    aria-label={sidebarVisible ? "Collapse sidebar" : "Expand sidebar"}
    onclick={handleToggle}
  >
    <PanelLeft class="h-5 w-5" />
  </button>
</div>

<aside
  aria-hidden={collapsed}
  class={`hidden flex-shrink-0 flex-col overflow-hidden bg-[#111827] text-white transition-[width] duration-200 ease-out md:flex ${
    collapsed ? "w-0" : "w-64"
  }`}
>
  <div class="flex min-h-[57px] flex-shrink-0 items-center pl-14 pr-4 pt-2">
    <h1 class="font-display text-xl font-bold">Architect Haven</h1>
  </div>

  <nav class="flex-1 px-4">
    <ul class="space-y-2">
      {#each navigation as item}
        {@const active = pathname === item.href}
        <li>
          <a href={item.href} class={linkClasses(active)}>
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {#each iconMarkup(item.icon) as path}
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={path} />
              {/each}
            </svg>
            <span class="ml-3">{item.name}</span>
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  {#if auth.isAuthenticated}
    <div class="border-t border-gray-700 p-4">
      <button
        type="button"
        class="rounded border border-gray-200 bg-white px-4 py-2 font-semibold text-secondary shadow-sm transition-colors hover:bg-gray-50 hover:text-secondary-hover hover:shadow"
        onclick={() => auth.signOut()}
      >
        Sign out
      </button>
    </div>
  {/if}
</aside>

{#if drawerOpen}
  <button
    type="button"
    class="fixed inset-0 z-[90] bg-black/40 md:hidden"
    aria-label="Close navigation drawer"
    onclick={closeDrawer}
  ></button>
  <aside class="fixed inset-y-0 left-0 z-[95] flex w-64 flex-col bg-[#111827] text-white md:hidden">
    <div class="p-6">
      <h1 class="font-display text-xl font-bold">Architect Haven</h1>
    </div>

    <nav class="flex-1 px-4">
      <ul class="space-y-2">
        {#each navigation as item}
          {@const active = pathname === item.href}
          <li>
            <a href={item.href} class={linkClasses(active)} onclick={closeDrawer}>
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {#each iconMarkup(item.icon) as path}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={path} />
                {/each}
              </svg>
              <span class="ml-3">{item.name}</span>
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    {#if auth.isAuthenticated}
      <div class="border-t border-gray-700 p-4">
        <button
          type="button"
          class="rounded border border-gray-200 bg-white px-4 py-2 font-semibold text-secondary shadow-sm transition-colors hover:bg-gray-50 hover:text-secondary-hover hover:shadow"
          onclick={async () => {
            closeDrawer();
            await auth.signOut();
          }}
        >
          Sign out
        </button>
      </div>
    {/if}
  </aside>
{/if}
