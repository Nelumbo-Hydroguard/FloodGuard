import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { DemoNotice } from "../components/DemoNotice";

export function Sobre() {
  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <PageHeader title="Sobre o FloodGuard" description="O que é, quem usa, o que já funciona e o que ainda é roadmap." />

      <SectionCard title="O que é">
        <p className="text-sm text-slate-400">
          <strong className="text-slate-200">FloodGuard é uma plataforma GovTech B2G</strong> —
          entregue a órgãos públicos, não diretamente ao cidadão. O usuário
          principal é a <strong className="text-slate-200">Defesa Civil municipal</strong>, que usa
          o painel para apoiar decisões em eventos de alagamento e
          inundação.
        </p>
      </SectionCard>

      <SectionCard title="Problema que resolve">
        <p className="text-sm text-slate-400">
          Dados relevantes para decisão em enchente hoje ficam fragmentados —
          suscetibilidade do terreno num lugar, chuva noutro, nível de rio
          noutro. FloodGuard cruza esses fatores numa única avaliação
          explicável, em vez de exigir que o operador cruze mentalmente
          fontes separadas.
        </p>
      </SectionCard>

      <SectionCard title="Por que Blumenau/SC">
        <p className="text-sm text-slate-400">
          Piloto com foco em <strong className="text-slate-200">Blumenau/SC</strong>, município com
          histórico relevante de eventos de inundação e onde o pipeline
          geoespacial (HAND) já foi processado sobre dados reais da região.
        </p>
      </SectionCard>

      <SectionCard title="Por que HAND">
        <p className="text-sm text-slate-400">
          <strong className="text-slate-200">HAND</strong> (Height Above Nearest Drainage) é uma
          camada de <strong className="text-slate-200">suscetibilidade</strong> topográfica — mede a
          altura de um ponto em relação à drenagem mais próxima. Não é uma
          previsão de inundação por si só; entra como um dos fatores do motor
          de risco. Detalhes técnicos em{" "}
          <code className="text-slate-500">docs/metodologia-hand.md</code>.
        </p>
      </SectionCard>

      <SectionCard title="Motor de risco">
        <p className="text-sm text-slate-400">
          O <strong className="text-slate-200">motor de risco é uma Prova de Conceito explicável</strong>
          : combina HAND, chuva acumulada, nível d'água e tendência numa
          fórmula transparente e auditável — pesos e referências de
          normalização são valores demonstrativos, não calibrados com dados
          reais de campo. Toda avaliação vem com justificativa textual e ação
          recomendada. Detalhes em{" "}
          <code className="text-slate-500">docs/motor-de-risco.md</code>.
        </p>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard title="Implementado">
          <ul className="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Motor de risco (fórmula + fatores + explicação)</li>
            <li>48 testes automatizados no backend, sem depender de banco</li>
            <li>API FastAPI com Swagger em <code className="text-slate-500">/docs</code></li>
            <li>Dashboard: painel, mapa, alertas, telemetria</li>
            <li>Dados HAND reais de Blumenau (limite, bacias, zonas)</li>
          </ul>
        </SectionCard>
        <SectionCard title="Simulado">
          <ul className="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Toda leitura de sensor (chuva, nível d'água)</li>
            <li>Payload UniMesh/LoRa (<code className="text-slate-500">implemented: false</code>)</li>
            <li>Os 3 cenários de demonstração</li>
            <li>Alertas exibidos no painel</li>
          </ul>
        </SectionCard>
        <SectionCard title="Roadmap">
          <ul className="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Nowcasting com <strong className="text-slate-200">U-RNN</strong> (previsão de chuva)</li>
            <li>Hardware/LoRaWAN/Meshtastic reais</li>
            <li>Autenticação e persistência de alertas</li>
            <li>App completo do cidadão</li>
          </ul>
        </SectionCard>
      </div>

      <DemoNotice>
        Nenhuma tela desta plataforma afirma que há sensores físicos,
        LoRaWAN, Meshtastic ou MQTT reais em operação — software-only e
        hardware-agnóstico. FloodGuard não substitui a análise da Defesa
        Civil.
      </DemoNotice>
    </div>
  );
}
