import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./index.css";
import { AppRouter } from "./router";
import { OperationsProvider } from "./state/OperationsProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {/* Estado operacional da demo (SOS + ajustes de abrigo) precisa
          atravessar rotas: o pedido nasce em /sos e é atendido em /operacao. */}
      <OperationsProvider>
        <AppRouter />
      </OperationsProvider>
    </BrowserRouter>
  </StrictMode>,
);
