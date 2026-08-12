export function Sobre() {
  return (
    <div className="max-w-2xl flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Sobre o FloodGuard</h1>

      <p className="text-slate-400">
        <strong className="text-slate-200">FloodGuard é uma plataforma GovTech B2G</strong> —
        vendida/entregue a órgãos públicos, não diretamente ao cidadão. O
        usuário principal é a <strong className="text-slate-200">Defesa Civil municipal</strong>,
        que usa o painel para apoiar decisões em eventos de alagamento e
        inundação.
      </p>

      <p className="text-slate-400">
        O piloto tem foco em <strong className="text-slate-200">Blumenau/SC</strong>, região com
        histórico relevante de eventos de inundação e onde o pipeline
        geoespacial (HAND) já foi processado.
      </p>

      <p className="text-slate-400">
        <strong className="text-slate-200">HAND</strong> (Height Above Nearest Drainage) é uma
        camada de <strong className="text-slate-200">suscetibilidade</strong> topográfica — mede a
        altura de um ponto em relação à drenagem mais próxima. Não é uma
        previsão de inundação por si só; entra como um dos fatores do motor
        de risco. Detalhes em{" "}
        <code className="text-slate-500">docs/metodologia-hand.md</code>.
      </p>

      <p className="text-slate-400">
        O <strong className="text-slate-200">motor de risco é uma Prova de Conceito explicável</strong>
        : combina HAND, chuva acumulada, nível d'água e tendência numa
        fórmula transparente e auditável — pesos e referências de
        normalização são valores demonstrativos, não calibrados com dados
        reais de campo. Toda avaliação vem com justificativa textual e ação
        recomendada. Detalhes em{" "}
        <code className="text-slate-500">docs/motor-de-risco.md</code>.
      </p>

      <p className="text-slate-400">
        <strong className="text-slate-200">Nowcasting com U-RNN</strong> (previsão de chuva de curto
        prazo) é <strong className="text-slate-200">roadmap</strong> — não está implementado. Ver{" "}
        <code className="text-slate-500">docs/roadmap.md</code>.
      </p>

      <div className="border border-slate-800 rounded-lg p-4 mt-2">
        <p className="text-sm text-slate-500">
          Todo dado exibido nesta plataforma é simulado (
          <code className="text-slate-600">source: "simulation"</code>). Não há
          sensores físicos, LoRaWAN, Meshtastic ou MQTT reais em operação —
          software-only e hardware-agnóstico. FloodGuard não substitui a
          análise da Defesa Civil.
        </p>
      </div>
    </div>
  );
}
