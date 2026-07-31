<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { PUBLIC_CONVEX_URL } from "$env/static/public";
  import { setupConvex, useConvexClient } from "convex-svelte";
  import { auth } from "$lib/auth.svelte";
  import ToastViewport from "$lib/components/ToastViewport.svelte";

  const { children } = $props();

  setupConvex(PUBLIC_CONVEX_URL);
  auth.initialize(useConvexClient());

  onMount(() => {
    return () => auth.destroy();
  });
</script>

<svelte:head>
  <title>Architect Haven</title>
  <meta
    name="description"
    content="Create, manage, and share interactive 3D building models."
  />
</svelte:head>

<ToastViewport />
{@render children()}
