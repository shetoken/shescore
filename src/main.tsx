import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// createRoot (not hydrateRoot): React clears #root and renders the live app,
// so the prerendered crawler snapshot causes no hydration mismatch.
createRoot(document.getElementById("root")!).render(<App />);
