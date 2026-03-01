import { useState, useId, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import BuildingForm from "../components/BuildingForm";
import UpgradeModal from "../components/UpgradeModal";

export default function BuildingsList() {
  const buildings = useQuery(api.buildings.list);
  const plans = useQuery(api.plans.get);
  const deleteBuilding = useMutation(api.buildings.remove);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const titleId = useId();
  const descId = useId();

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteBuilding({ id: deleteTargetId as any });
      toast.success("Building deleted successfully");
      setDeleteTargetId(null);
    } catch (error) {
      toast.error("Failed to delete building");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTargetId(null);
  };

  useEffect(() => {
    if (deleteTargetId == null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteTargetId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTargetId]);

  const getTotalFloors = (sections: any[]) => {
    return sections.reduce((total, section) => {
      return total + (section.endFloor - section.startFloor + 1);
    }, 0);
  };

  const freeLimit = plans?.freeLimit ?? 5;
  const atLimit = Array.isArray(buildings) && buildings.length >= freeLimit;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1
            className="text-3xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Your Buildings
          </h1>
          <p className="text-gray-600">
            Manage and view your 3D building models
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            atLimit ? setShowUpgradeModal(true) : setShowCreateForm(true)
          }
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors mt-4 sm:mt-0 self-center sm:self-auto"
        >
          Create Building
        </button>
      </div>

      {buildings === undefined ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : buildings.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No buildings yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first 3D building model to get started
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Create Your First Building
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildings.map((building) => (
            <Link
              key={building._id}
              to={`/buildings/${building._id}`}
              className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-300 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {building.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteClick(building._id);
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center text-gray-600">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-sm">
                    {getTotalFloors(building.sections)} floors
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateForm && (
        <BuildingForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            toast.success("Building created successfully");
          }}
        />
      )}

      {deleteTargetId != null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <div
            className="fixed inset-0 bg-black/50"
            aria-hidden="true"
            onClick={handleDeleteCancel}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
            <h2
              id={titleId}
              className="text-lg font-semibold text-gray-900 mb-2"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Delete building?
            </h2>
            <p id={descId} className="text-gray-600 mb-6">
              Are you sure you want to delete this building? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        plans={plans}
      />
    </div>
  );
}
