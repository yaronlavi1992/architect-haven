# Vision

Architect Haven is a web application for organizing architectural building projects and presenting their structure clearly. It should help architects and project stakeholders create buildings, navigate their levels and files, review associated documents, and share useful project views without unnecessary friction.

## Product direction

The product should prioritize:

- **Clear building organization:** Buildings, floors, spaces, files, and project metadata should be easy to understand and navigate.
- **Useful visual context:** The building canvas and related views should communicate structure and status clearly across desktop and mobile layouts.
- **Reliable document workflows:** Users should be able to attach, inspect, and manage project documents with predictable loading, error, and empty states.
- **Safe collaboration and sharing:** Shared links should expose only the intended building information and should behave consistently for signed-in and anonymous visitors.
- **Straightforward account management:** Authentication, settings, plan limits, and Stripe-backed upgrades should be clear and trustworthy.
- **Maintainable delivery:** Changes should preserve SvelteKit, Svelte 5, Convex, and Playwright conventions and remain testable through the repository's existing scripts.

## Non-goals

Architect Haven should not become a general-purpose CAD or BIM authoring suite. Deep geometry editing, engineering simulation, and unrelated project-management features should only be introduced when the product direction explicitly expands to include them.

The cloud factory must not merge changes automatically. Agents may triage work, prepare specifications, implement bounded changes, review pull requests, and collect verification evidence, but a human remains responsible for approval and release.
