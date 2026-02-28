import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Dashboard() {
  const user = useQuery(api.auth.loggedInUser);
  const buildings = useQuery(api.buildings.list);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Welcome back, {user?.name || user?.email || "Architect"}!
        </h1>
        <p className="text-gray-600">
          Ready to create amazing 3D building models?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/buildings"
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">{buildings?.length || 0}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Buildings</h3>
          <p className="text-gray-600 text-sm">
            Manage your 3D building models and documentation
          </p>
        </Link>
      </div>
    </div>
  );
}
