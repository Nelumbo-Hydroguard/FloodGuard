import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./index.css";
import { AppRouter } from "./router";
import { OperationsProvider } from "./state/OperationsProvider";
import { RoleProvider } from "./state/RoleProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {/* Perfil de visualização por fora: navegação, portões e o conteúdo
          das telas compartilhadas dependem dele. Não é autenticação. */}
      <RoleProvider>
        {/* Estado operacional da demo (SOS + ajustes de abrigo) precisa
            atravessar rotas: o pedido nasce em /sos e é atendido em /operacao. */}
        <OperationsProvider>
          <AppRouter />
        </OperationsProvider>
      </RoleProvider>
    </BrowserRouter>
  </StrictMode>,
);
