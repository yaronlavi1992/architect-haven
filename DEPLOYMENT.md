# Architect Haven – Deployment & Next Steps

## Done via CLI

- **STRIPE_SECRET_KEY** – Set in Convex (dev) from `stripe config`
- **HOSTING_URL** – Set to `http://localhost:5173` in Convex
- **Convex prod deploy** – Deployed to `https://keen-wolf-134.convex.cloud`
- **scripts/setup-stripe.sh** – Automated setup script

## Blocked (requires your action)

### 1. Stripe keys expired

Your Stripe CLI keys expired (2025-12-24). Run:

```bash
stripe login
```

Then re-run the setup script:

```bash
./scripts/setup-stripe.sh      # dev
./scripts/setup-stripe.sh prod  # prod
```

### 2. Stripe webhook secret

**Dev:** Run in a terminal (keep it open for local testing):

```bash
stripe listen --forward-to https://fine-panda-433.convex.site/stripe-webhook
```

Copy the `whsec_...` from the output, then:

```bash
echo 'whsec_YOUR_SECRET' | npx convex env set STRIPE_WEBHOOK_SECRET
```

**Prod:** Stripe Dashboard → Developers → Webhooks → Add endpoint

- URL: `https://keen-wolf-134.convex.site/stripe-webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`
- Copy signing secret → `echo 'whsec_XXX' | npx convex env set STRIPE_WEBHOOK_SECRET --prod`

### 3. Vercel deploy

```bash
vercel login   # one-time, opens browser
npx vercel deploy --prod
```

Add env var in Vercel dashboard: `VITE_CONVEX_URL` = `https://keen-wolf-134.convex.cloud`

Then set Convex prod HOSTING_URL:

```bash
echo 'https://architecthaven-3dbuildingmodelingap.vercel.app' | npx convex env set HOSTING_URL --prod
```

---

## Env vars summary

| Var | Where | Purpose |
|-----|-------|---------|
| `VITE_CONVEX_URL` | Vercel | `https://keen-wolf-134.convex.cloud` |
| `STRIPE_SECRET_KEY` | Convex | Set ✓ (refresh after stripe login) |
| `STRIPE_WEBHOOK_SECRET` | Convex | From stripe listen or Dashboard |
| `HOSTING_URL` | Convex | Set ✓ (update for prod URL) |
