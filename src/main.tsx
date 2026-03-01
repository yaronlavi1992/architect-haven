import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";

// test comment
const url = import.meta.env.VITE_CONVEX_URL;
if (!url) throw new Error("VITE_CONVEX_URL is required");

const convex = new ConvexReactClient(url);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </ErrorBoundary>,
);
