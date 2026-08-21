import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { RoleGate } from "./components/RoleGate";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { RiskMap } from "./pages/RiskMap";
import { Alertas } from "./pages/Alertas";
import { AlertDetail } from "./pages/AlertDetail";
import { Telemetria } from "./pages/Telemetria";
import { SOS } from "./pages/SOS";
import { Operacao } from "./pages/Operacao";
import { Shelters } from "./pages/Shelters";
import { Acesso } from "./pages/Acesso";
import { Sobre } from "./pages/Sobre";
import { NotFound } from "./pages/NotFound";

/**
 * `<RoleGate>` envolve as rotas que pertencem a um público específico. Ele
 * troca o conteúdo por um convite de mudança de perfil — é adaptação de
 * experiência, NÃO controle de acesso (ver lib/roleAccess.ts).
 *
 * As rotas compartilhadas (/mapa, /alertas, /abrigos) ficam de fora de
 * propósito: elas não mudam de dono, mudam de linguagem — e cada tela faz
 * isso por dentro, sem duplicar rota por perfil.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route
          path="/painel"
          element={
            <RoleGate>
              <Dashboard />
            </RoleGate>
          }
        />
        <Route path="/mapa" element={<RiskMap />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/alertas/:id" element={<AlertDetail />} />
        <Route
          path="/telemetria"
          element={
            <RoleGate>
              <Telemetria />
            </RoleGate>
          }
        />
        {/* Envio (cidadão) e gestão (operação) são telas separadas de
            propósito — públicos diferentes, gestos diferentes (F11). */}
        <Route
          path="/sos"
          element={
            <RoleGate>
              <SOS />
            </RoleGate>
          }
        />
        <Route
          path="/operacao"
          element={
            <RoleGate>
              <Operacao />
            </RoleGate>
          }
        />
        <Route path="/abrigos" element={<Shelters />} />
        <Route path="/acesso" element={<Acesso />} />
        <Route path="/sobre" element={<Sobre />} />
        {/* Catch-all dentro do Layout — mantém nav e dá saída ao usuário
            em vez de renderizar tela vazia (F6.2.1). */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
