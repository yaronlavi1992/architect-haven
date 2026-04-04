<script lang="ts">
  import { goto } from "$app/navigation";
  import { auth } from "$lib/auth.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { toast } from "$lib/toasts.svelte";

  let flow = $state<"signIn" | "signUp">("signIn");
  let submitting = $state(false);

  $effect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      goto("/dashboard", { replaceState: true });
    }
  });

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submitting = true;

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("flow", flow);

    try {
      await auth.signIn("password", formData);
      toast.success(flow === "signIn" ? "Signed in!" : "Account created!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      if (message.includes("Invalid password")) {
        toast.error("Invalid password. Please try again.");
      } else if (message.includes("sign up") || message.includes("sign in")) {
        toast.error(
          flow === "signIn"
            ? "Could not sign in, did you mean to sign up?"
            : "Could not sign up, did you mean to sign in?",
        );
      } else {
        toast.error(message);
      }
    } finally {
      submitting = false;
    }
  }

  async function handleAnonymous() {
    submitting = true;

    try {
      await auth.signIn("anonymous");
      toast.success("Signed in!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Anonymous sign-in failed");
    } finally {
      submitting = false;
    }
  }

  async function handleGoogle() {
    try {
      await auth.signIn("google");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
    }
  }
</script>

{#if auth.isLoading}
  <LoadingSpinner fullScreen />
{:else}
  <div class="flex min-h-screen items-center justify-center bg-gray-50">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <h1 class="font-display mb-2 text-3xl font-bold text-gray-900">Welcome to Architect Haven</h1>
        <p class="text-gray-600">
          {flow === "signIn" ? "Sign in to access your 3D building models" : "Create your account"}
        </p>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <form class="space-y-6" onsubmit={handleSubmit}>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700" for="email">Email</label>
            <input id="email" name="email" type="email" class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email" required />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700" for="password">Password</label>
            <input id="password" name="password" type="password" class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" required />
          </div>

          <button type="submit" class="w-full rounded-md bg-green-500 py-3 font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50" disabled={submitting}>
            {submitting ? "Loading..." : flow === "signIn" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div class="mt-6 text-center">
          <button type="button" class="text-sm text-blue-600 hover:underline" onclick={() => (flow = flow === "signIn" ? "signUp" : "signIn")}>
            {flow === "signIn" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div class="my-6 flex items-center justify-center">
          <hr class="flex-1 border-gray-200" />
          <span class="mx-4 text-sm text-gray-500">or</span>
          <hr class="flex-1 border-gray-200" />
        </div>

        <div class="space-y-3">
          <button
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-3 font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-50"
            disabled={submitting}
            onclick={handleGoogle}
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>

        <div class="my-6 flex items-center justify-center">
          <hr class="flex-1 border-gray-200" />
          <span class="mx-4 text-sm text-gray-500">or</span>
          <hr class="flex-1 border-gray-200" />
        </div>

        <button
          type="button"
          class="w-full rounded-md bg-gray-500 py-3 font-semibold text-white transition-colors hover:bg-gray-600 disabled:opacity-50"
          disabled={submitting}
          onclick={handleAnonymous}
        >
          Sign in anonymously
        </button>
      </div>
    </div>
  </div>
{/if}
