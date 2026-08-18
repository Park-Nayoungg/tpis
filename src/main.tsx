import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TpisLanding from "./TpisLanding";

import App from "./App";
import "./App.css";

createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
        <App />
        {/* <TpisLanding /> */}
    </StrictMode>
);
