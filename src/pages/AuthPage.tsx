import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { toast } from "sonner";

export default function AuthPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("flow", flow);
    
    try {
      await signIn("password", formData);
      toast.success(flow === "signIn" ? "Signed in!" : "Account created!");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Authentication failed";
      if (msg.includes("Invalid password")) {
        toast.error("Invalid password. Please try again.");
      } else if (msg.includes("sign up") || msg.includes("sign in")) {
        toast.error(flow === "signIn" ? "Could not sign in, did you mean to sign up?" : "Could not sign up, did you mean to sign in?");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnonymous = async () => {
    setSubmitting(true);
    try {
      await signIn("anonymous");
      toast.success("Signed in!");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Anonymous sign-in failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Welcome to Architect Haven
          </h1>
          <p className="text-gray-600">
            {flow === "signIn" ? "Sign in to access your 3D building models" : "Create your account"}
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-md transition-colors disabled:opacity-50"
            >
              {submitting ? "Loading..." : (flow === "signIn" ? "Sign In" : "Sign Up")}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              className="text-blue-600 hover:underline text-sm"
            >
              {flow === "signIn" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="flex items-center justify-center my-6">
            <hr className="flex-1 border-gray-200" />
            <span className="mx-4 text-gray-500 text-sm">or</span>
            <hr className="flex-1 border-gray-200" />
          </div>

          <button
            onClick={handleAnonymous}
            disabled={submitting}
            className="w-full bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white font-semibold py-3 rounded-md transition-colors"
          >
            Sign in anonymously
          </button>
        </div>
      </div>
    </div>
  );
}
