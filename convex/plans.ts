import { query } from "./_generated/server";

export const FREE_LIMIT = 5;

export const PLANS = {
  free: {
    name: "Free Plan",
    buildingLimit: FREE_LIMIT,
    priceDisplay: "$0",
    features: ["Up to 5 buildings", "3D visualization", "Document management"],
  },
  pro: {
    name: "Pro Plan",
    buildingLimit: null as number | null,
    priceDisplay: "$20",
    features: ["Unlimited buildings", "3D visualization", "Document management"],
  },
} as const;

export const get = query({
  args: {},
  handler: async () => {
    return {
      freeLimit: FREE_LIMIT,
      proPriceDisplay: PLANS.pro.priceDisplay,
      plans: PLANS,
    };
  },
});
