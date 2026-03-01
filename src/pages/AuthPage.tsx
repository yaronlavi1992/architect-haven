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

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void signIn("google")}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-800 font-medium py-3 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
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
