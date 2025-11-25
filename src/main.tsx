import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { consoleRecorder } from "@/lib/consoleRecorder";

// Start recording console logs for debugging
consoleRecorder.start();

createRoot(document.getElementById("root")!).render(<App />);
