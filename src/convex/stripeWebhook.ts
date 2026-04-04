import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const handleStripeWebhook = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }
  const payload = await request.text();
  const result = await ctx.runAction(internal.stripe.fulfillWebhook, {
    signature,
    payload,
  });
  return new Response(null, { status: result.success ? 200 : 400 });
});
