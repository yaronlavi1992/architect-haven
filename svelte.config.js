import adapter from "@sveltejs/adapter-vercel";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    experimental: {
      async: true,
    },
  },
  kit: {
    adapter: adapter(),
    alias: {
      "@": "./src",
      $convex: "./src/convex",
    },
    experimental: {
      remoteFunctions: true,
    },
  },
};

export default config;
