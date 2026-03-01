"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import Stripe from "stripe";

const PRO_PRICE_CENTS = 2000;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
}

export const createCheckoutOrPortal = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const identity = await ctx.auth.getUserIdentity();
    const subscription = await ctx.runQuery(
      internal.subscriptions.getByUserForAction,
      {
        userId,
      },
    );
    if (!subscription) {
      await ctx.runMutation(internal.subscriptions.create, { userId });
    }

    const hostingUrl = process.env.HOSTING_URL ?? "http://localhost:5173";
    const returnUrl = `${hostingUrl}/settings`;

    if (subscription?.stripeCustomerId) {
      const session = await getStripe().billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      });
      return session.url!;
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    const lineItems: Stripe.Checkout.SessionCreateParams["line_items"] = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Architect Haven Pro",
                description: "Unlimited buildings",
              },
              unit_amount: PRO_PRICE_CENTS,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ];

    const session = await getStripe().checkout.sessions.create({
      success_url: `${returnUrl}?success=1`,
      cancel_url: returnUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: identity?.email ?? undefined,
      line_items: lineItems,
      metadata: { userId },
    });
    if (!session.url) throw new Error("Stripe did not return checkout URL");
    return session.url;
  },
});

export const fulfillWebhook = internalAction({
  args: { signature: v.string(), payload: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not set");
      return { success: false };
    }
    try {
      const event = getStripe().webhooks.constructEvent(
        args.payload,
        args.signature,
        webhookSecret,
      );
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const subId = session.subscription as string;
        if (!subId) return { success: true };
        const subscription = await getStripe().subscriptions.retrieve(subId);
        const userId = session.metadata?.userId as
          | import("./_generated/dataModel").Id<"users">
          | undefined;
        if (!userId) return { success: true };
        await ctx.runMutation(internal.subscriptions.upsertFromCheckout, {
          userId,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: subscription.current_period_end,
        });
      } else if (
        event.type === "customer.subscription.updated" ||
        event.type === "invoice.payment_succeeded"
      ) {
        const subscription = event.data.object as Stripe.Subscription;
        await ctx.runMutation(internal.subscriptions.updatePeriodEnd, {
          stripeSubscriptionId: subscription.id,
          stripeCurrentPeriodEnd: subscription.current_period_end,
        });
      } else if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        await ctx.runMutation(internal.subscriptions.cancel, {
          stripeSubscriptionId: subscription.id,
        });
      }
      return { success: true };
    } catch (err) {
      console.error("Stripe webhook error:", err);
      return { success: false };
    }
  },
});
