#!/usr/bin/env bash
# Run after: stripe login (refreshes expired keys)
# Usage: ./scripts/setup-stripe.sh [dev|prod]
set -e
cd "$(dirname "$0")/.."
TARGET=${1:-dev}
PROD_FLAG=""
[ "$TARGET" = "prod" ] && PROD_FLAG="--prod"

echo "=== Target: $TARGET ==="

echo ""
echo "=== 1. Setting STRIPE_SECRET_KEY in Convex ==="
STRIPE_KEY=$(stripe config --list 2>/dev/null | grep "test_mode_api_key" | cut -d"'" -f2)
if [ -z "$STRIPE_KEY" ]; then
  echo "Run 'stripe login' first (keys may be expired)"
  exit 1
fi
echo "$STRIPE_KEY" | npx convex env set STRIPE_SECRET_KEY $PROD_FLAG
echo "OK"

echo ""
echo "=== 2. Webhook secret ==="
if [ "$TARGET" = "dev" ]; then
  echo "Run in another terminal: stripe listen --forward-to https://fine-panda-433.convex.site/stripe-webhook"
  echo "Copy the whsec_... value, then: echo 'whsec_XXX' | npx convex env set STRIPE_WEBHOOK_SECRET"
else
  echo "Create webhook at Stripe Dashboard -> Developers -> Webhooks"
  echo "URL: https://keen-wolf-134.convex.site/stripe-webhook"
  echo "Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_succeeded"
  echo "Then: echo 'whsec_XXX' | npx convex env set STRIPE_WEBHOOK_SECRET --prod"
fi

echo ""
echo "=== 3. Setting HOSTING_URL ==="
URL="${HOSTING_URL:-http://localhost:5173}"
[ "$TARGET" = "prod" ] && URL="${HOSTING_URL:-https://your-app.vercel.app}"
echo "$URL" | npx convex env set HOSTING_URL $PROD_FLAG
echo "OK"
