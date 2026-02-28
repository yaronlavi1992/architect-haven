import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "sonner";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import BuildingsList from "./pages/BuildingsList";
import BuildingDetail from "./pages/BuildingDetail";
import Settings from "./pages/Settings";
import AuthPage from "./pages/AuthPage";
import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/buildings" element={<ProtectedRoute><DashboardLayout><BuildingsList /></DashboardLayout></ProtectedRoute>} />
          <Route path="/buildings/:id" element={<ProtectedRoute><DashboardLayout><BuildingDetail /></DashboardLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 min-h-0 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
