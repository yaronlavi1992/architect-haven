# Roadmap

This roadmap gives triage and specification agents enough direction to route Architect Haven issues. It describes product areas rather than promising dates or releases.

## 1. Building and project organization

- Create, edit, archive, and navigate buildings reliably.
- Improve the representation of levels, spaces, files, and project metadata.
- Make loading, validation, error, and empty states clear.

Small, well-defined fixes are usually ready to implement. Changes to the core data model, ownership, or deletion behavior should normally be specified first.

## 2. Building visualization and navigation

- Improve the building canvas, legends, selection behavior, and responsive layout.
- Keep navigation between dashboards, building lists, and building details predictable.
- Preserve accessibility and usable keyboard, pointer, and touch interactions.

Visual fixes with clear acceptance criteria may be implemented directly. New modeling interactions or major canvas behavior should be specified first.

## 3. Documents and shared views

- Make project documents easy to associate with and inspect from a building.
- Improve shared building links and public presentation views.
- Prevent private data from leaking through shared or anonymous routes.

Security, authorization, storage, or sharing-model changes require careful specification unless they are narrow, proven defects.

## 4. Authentication and account experience

- Maintain reliable password, Google, and anonymous sign-in flows.
- Improve account settings and transitions between anonymous and registered use.
- Provide clear recovery behavior when authentication or Convex connectivity fails.

Authentication and authorization changes should generally be specified before implementation.

## 5. Plans, billing, and limits

- Explain plan capabilities and limits clearly.
- Keep Stripe checkout, webhook handling, subscription state, and upgrade prompts consistent.
- Test billing-related behavior without exposing secrets or performing unintended live transactions.

Billing and entitlement changes should normally be specified first. Small copy or presentation fixes may be ready to implement.

## 6. Reliability, testing, and delivery

- Maintain `npm run check`, `npm run build`, and relevant Playwright coverage.
- Improve deterministic local setup and deployment documentation.
- Add actionable error handling and diagnostics without leaking credentials or user data.

Bounded test and documentation improvements are usually ready to implement. Toolchain or deployment architecture changes may require a specification.

## Triage guidance

- **Ready to implement:** The desired behavior is clear, cohesive, low-risk, and small enough for a focused pull request.
- **Ready to spec:** The issue fits this roadmap but needs product decisions, data-model changes, security-sensitive work, billing changes, or substantial architecture.
- **Needs info:** The expected behavior, reproduction steps, affected user, or acceptance criteria are unclear.
- **Wait to implement:** The request is outside the current vision, duplicates existing work, or should not be automated yet.
