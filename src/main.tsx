import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as serviceWorker from "./serviceWorkerRegistration.ts"; // ✅ add this

createRoot(document.getElementById("root")!).render(<App />);

// Register the service worker
serviceWorker.register(); // ✅ enable PWA