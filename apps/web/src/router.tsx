import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { RiskMap } from "./pages/RiskMap";
import { AlertDetail } from "./pages/AlertDetail";
import { Shelters } from "./pages/Shelters";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/painel" element={<Dashboard />} />
        <Route path="/mapa" element={<RiskMap />} />
        <Route path="/alertas/:id" element={<AlertDetail />} />
        <Route path="/abrigos" element={<Shelters />} />
      </Route>
    </Routes>
  );
}
