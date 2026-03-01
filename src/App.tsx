import { ErrorBoundary } from "react-error-boundary";
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
import ErrorFallback from "./components/ErrorFallback";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayoutWithProvider><Dashboard /></DashboardLayoutWithProvider></ProtectedRoute>} />
          <Route path="/buildings" element={<ProtectedRoute><DashboardLayoutWithProvider><BuildingsList /></DashboardLayoutWithProvider></ProtectedRoute>} />
          <Route path="/buildings/:id" element={<ProtectedRoute><DashboardLayoutWithProvider><BuildingDetail /></DashboardLayoutWithProvider></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><DashboardLayoutWithProvider><Settings /></DashboardLayoutWithProvider></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
        <Toaster />
      </div>
    </Router>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className="flex h-screen bg-gray-50 md:gap-3">
      <Sidebar />
      <main
        className={`flex-1 min-h-0 min-w-0 overflow-auto p-4 md:p-8 pl-12 ${
          collapsed ? "md:pl-12" : "md:pl-0"
        }`}
      >
        <div className="mx-auto min-w-0 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

function DashboardLayoutWithProvider({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </SidebarProvider>
  );
}
