<script lang="ts">
  import { goto } from "$app/navigation";
  import { auth } from "$lib/auth.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

  const texts = ["Architects.", "Consultants.", "Managers.", "Engineers."];

  let currentText = $state("");
  let currentIndex = $state(0);
  let isDeleting = $state(false);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Senior Architect",
      company: "Urban Design Co.",
      text: "Architect Haven has revolutionized how we present building concepts to clients. The 3D visualization is incredible.",
      avatar: "SJ",
    },
    {
      name: "Michael Chen",
      role: "Construction Manager",
      company: "BuildTech Solutions",
      text: "The document management system keeps all our project files organized and easily accessible. Game changer!",
      avatar: "MC",
    },
    {
      name: "Emily Rodriguez",
      role: "Design Consultant",
      company: "Modern Spaces",
      text: "Being able to share interactive 3D models with stakeholders has improved our collaboration tremendously.",
      avatar: "ER",
    },
    {
      name: "David Park",
      role: "Project Engineer",
      company: "Structural Innovations",
      text: "The apartment-level detail and document attachment features are exactly what we needed for complex projects.",
      avatar: "DP",
    },
  ];

  $effect(() => {
    if (auth.isLoading || auth.isAuthenticated) return;

    const timeout = window.setTimeout(
      () => {
        const current = texts[currentIndex];
        if (isDeleting) {
          currentText = current.slice(0, Math.max(currentText.length - 1, 0));
          if (currentText === "") {
            isDeleting = false;
            currentIndex = (currentIndex + 1) % texts.length;
          }
        } else {
          currentText = current.slice(0, currentText.length + 1);
          if (currentText === current) {
            window.setTimeout(() => {
              isDeleting = true;
            }, 2000);
          }
        }
      },
      isDeleting ? 50 : 100,
    );

    return () => window.clearTimeout(timeout);
  });

  $effect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      goto("/dashboard", { replaceState: true });
    }
  });
</script>

{#if auth.isLoading}
  <LoadingSpinner fullScreen />
{:else}
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800">
    <nav class="flex items-center justify-between p-6">
      <div class="font-display text-2xl font-bold text-white">Architect Haven</div>
      <a
        href="/auth"
        class="rounded-lg bg-white px-6 py-2 font-semibold text-gray-900 transition-colors hover:bg-gray-100"
      >
        Sign In
      </a>
    </nav>

    <div class="flex flex-col items-center justify-center px-6 py-20 text-center">
      <h1 class="font-display mb-6 text-5xl font-bold text-white md:text-7xl">
        The Best 3D Modeling Tool for
        <span class="text-blue-400">
          {currentText}
          <span class="animate-pulse">|</span>
        </span>
      </h1>

      <p class="mb-12 max-w-3xl text-xl text-gray-300 md:text-2xl">
        Bridging the gap between Architects and Advisors.
      </p>

      <a
        href="/auth"
        class="rounded-lg bg-green-500 px-8 py-4 text-xl font-semibold text-white shadow-lg transition-colors hover:bg-green-600 hover:shadow-xl"
      >
        Start Building Models For Free
      </a>
    </div>

    <div class="px-6 py-20">
      <h2 class="font-display mb-16 text-center text-4xl font-bold text-white">
        Trusted by Industry Leaders
      </h2>

      <div class="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
        {#each testimonials as testimonial}
          <div class="rounded-xl bg-[#192339] p-8 shadow-lg transition-shadow hover:shadow-xl">
            <div class="mb-4 flex items-center">
              <div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
                {testimonial.avatar}
              </div>

              <div>
                <h3 class="font-semibold text-white">{testimonial.name}</h3>
                <p class="text-sm text-gray-400">{testimonial.role}</p>
                <p class="text-sm text-gray-500">{testimonial.company}</p>
              </div>
            </div>

            <p class="leading-relaxed text-gray-300">"{testimonial.text}"</p>
          </div>
        {/each}
      </div>
    </div>

    <footer class="py-8 text-center text-gray-400">
      <p>&copy; 2024 Architect Haven. All rights reserved.</p>
    </footer>
  </div>
{/if}
