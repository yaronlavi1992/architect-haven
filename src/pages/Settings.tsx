import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const subscription = useQuery(api.subscriptions.getByUser);
  const plans = useQuery(api.plans.get);
  const createCheckout = useAction(api.stripe.createCheckoutOrPortal);
  const [loading, setLoading] = useState(false);

  const isPro =
    subscription?.stripeCurrentPeriodEnd &&
    subscription.stripeCurrentPeriodEnd * 1000 > Date.now();

  const plan = plans?.plans[isPro ? "pro" : "free"];

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const url = await createCheckout();
      if (url) {
        window.location.href = url;
      } else {
        toast.error("No checkout URL returned");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to open checkout";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-3xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Settings
        </h1>
        <p className="text-gray-600">Manage your account and subscription</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Current Plan
        </h2>

        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${
            isPro
              ? "bg-indigo-50 border-indigo-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <div>
            <h3
              className={`font-semibold ${isPro ? "text-indigo-800" : "text-green-800"}`}
            >
              {plan?.name ?? (isPro ? "Pro Plan" : "Free Plan")}
            </h3>
            <p
              className={`text-sm ${isPro ? "text-indigo-600" : "text-green-600"}`}
            >
              {plan?.buildingLimit != null
                ? `Up to ${plan.buildingLimit} buildings`
                : "Unlimited buildings"}
            </p>
          </div>
          <div className="text-right">
            <div
              className={`text-2xl font-bold ${isPro ? "text-indigo-800" : "text-green-800"}`}
            >
              {plan?.priceDisplay ?? (isPro ? "$20" : "$0")}
            </div>
            <div
              className={`text-sm ${isPro ? "text-indigo-600" : "text-green-600"}`}
            >
              per month
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Plan Features</h3>
          <ul className="space-y-2 text-gray-600">
            {(
              plan?.features ??
              (isPro
                ? [
                    "Unlimited buildings",
                    "3D visualization",
                    "Document management",
                  ]
                : [
                    "Up to 5 buildings",
                    "3D visualization",
                    "Document management",
                  ])
            ).map((feature) => (
              <li key={feature} className="flex items-center">
                <svg
                  className="w-4 h-4 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            {isPro ? "Manage Subscription" : "Upgrade to Pro"}
          </h3>
          <p className="text-blue-600 text-sm mb-3">
            {isPro
              ? "Update payment method or cancel subscription"
              : `Get unlimited buildings for ${plans?.proPriceDisplay ?? "$20"}/month`}
          </p>
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading
              ? "Loading..."
              : isPro
                ? "Manage Billing"
                : "Upgrade to Pro"}
          </button>
        </div>
      </div>
    </div>
  );
}
