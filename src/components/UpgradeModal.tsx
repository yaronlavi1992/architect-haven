import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  plans: {
    freeLimit?: number;
    proPriceDisplay?: string;
    plans?: {
      free?: { name?: string; buildingLimit?: number; priceDisplay?: string; features?: readonly string[] };
      pro?: { name?: string; buildingLimit?: number | null; priceDisplay?: string; features?: readonly string[] };
    };
  } | undefined;
}

export default function UpgradeModal({ open, onClose, plans }: UpgradeModalProps) {
  const createCheckout = useAction(api.stripe.createCheckoutOrPortal);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const freePlan = plans?.plans?.free;
  const proPlan = plans?.plans?.pro;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const url = await createCheckout();
      if (url) window.location.href = url;
      else toast.error("Could not start checkout");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      onClick={onClose}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 id="upgrade-modal-title" className="text-xl font-bold text-gray-900" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Upgrade to create more buildings
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600 text-sm mb-6">
          You&apos;ve reached the free plan limit ({plans?.freeLimit ?? 5} buildings). Upgrade to Pro for unlimited buildings.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">{freePlan?.name ?? "Free"}</h3>
            <p className="text-2xl font-bold text-gray-700 mt-1">{freePlan?.priceDisplay ?? "$0"}</p>
            <p className="text-xs text-gray-500 mt-1">per month</p>
            <ul className="mt-3 space-y-1 text-sm text-gray-600">
              {(freePlan?.features ?? []).map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg border-2 border-indigo-500 bg-indigo-50/50">
            <h3 className="font-semibold text-indigo-900">{proPlan?.name ?? "Pro"}</h3>
            <p className="text-2xl font-bold text-indigo-800 mt-1">{proPlan?.priceDisplay ?? "$20"}</p>
            <p className="text-xs text-indigo-600 mt-1">per month</p>
            <ul className="mt-3 space-y-1 text-sm text-indigo-800">
              {(proPlan?.features ?? []).map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-indigo-500">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Upgrade to Pro"}
          </button>
        </div>
      </div>
    </div>
  );
}
