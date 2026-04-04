<script lang="ts">
  interface Props {
    fullScreen?: boolean;
    className?: string;
  }

  let { fullScreen = false, className = "" }: Props = $props();
</script>

<div
  class={`flex items-center justify-center ${fullScreen ? "min-h-screen bg-gray-50" : "h-64"} ${className}`}
>
  <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
</div>
