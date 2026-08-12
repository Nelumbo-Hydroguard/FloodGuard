import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { RiskMap } from "./pages/RiskMap";
import { Alertas } from "./pages/Alertas";
import { AlertDetail } from "./pages/AlertDetail";
import { Telemetria } from "./pages/Telemetria";
import { Shelters } from "./pages/Shelters";
import { Sobre } from "./pages/Sobre";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/painel" element={<Dashboard />} />
        <Route path="/mapa" element={<RiskMap />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/alertas/:id" element={<AlertDetail />} />
        <Route path="/telemetria" element={<Telemetria />} />
        <Route path="/abrigos" element={<Shelters />} />
        <Route path="/sobre" element={<Sobre />} />
      </Route>
    </Routes>
  );
}
