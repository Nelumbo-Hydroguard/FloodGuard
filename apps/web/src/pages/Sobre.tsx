import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { DemoNotice } from "../components/DemoNotice";

/**
 * `/sobre` — a única tela de documentação do produto.
 *
 * A F11 (product UX cleanup) tirou metodologia, conceitos e limitações das
 * telas operacionais (/painel, /mapa, /alertas, /telemetria, /abrigos) e
 * centralizou tudo aqui. Nada foi apagado: o texto que estava embaixo do
 * mapa ("o que é HAND", "por que as zonas ultrapassam Blumenau"), o roadmap
 * de abrigos e os avisos longos de dados simulados foram reaproveitados nas
 * seções abaixo. Se um conteúdo educacional voltar a aparecer numa tela de
 * operação, o lugar dele é aqui.
 */

const SECTIONS = [
  { id: "o-que-e", label: "O que é" },
  { id: "como-funciona", label: "Como funciona" },
  { id: "hand", label: "HAND" },
  { id: "dados", label: "Dados utilizados" },
  { id: "motor", label: "Motor de risco" },
  { id: "telemetria", label: "Telemetria" },
  { id: "mapa", label: "Mapa e contexto geoespacial" },
  { id: "alertas", label: "Alertas" },
  { id: "sos", label: "SOS e atendimento" },
  { id: "simulado", label: "Dados simulados" },
  { id: "limitacoes", label: "Limitações atuais" },
  { id: "arquitetura", label: "Arquitetura" },
  { id: "proximos-passos", label: "Próximos passos" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <SectionCard title={title}>{children}</SectionCard>
    </section>
  );
}

const P = "text-sm leading-relaxed text-slate-400";
const LIST = "mt-2 list-inside list-disc space-y-1.5 text-sm text-slate-400";
const STRONG = "text-slate-200";

export function Sobre() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Documentação"
        title="Saiba mais"
        description="Nelumbo FloodGuard: resiliência, comunicação e inteligência para o apoio à decisão em inundações e eventos hidrológicos."
      />

      <nav className="panel flex flex-wrap gap-x-4 gap-y-2 p-4">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="text-xs text-slate-400 underline-offset-2 transition-colors hover:text-accent hover:underline"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-6">
        <Section id="o-que-e" title="1. O que é o FloodGuard">
          <p className={P}>
            <strong className={STRONG}>Plataforma GovTech B2G</strong> de apoio à decisão —
            entregue a órgãos públicos, não diretamente ao cidadão. O usuário principal é o
            operador da <strong className={STRONG}>Defesa Civil municipal</strong>, em sala de
            operação durante um evento de alagamento ou inundação.
          </p>
          <p className={`${P} mt-3`}>
            Os dados que importam numa enchente hoje ficam fragmentados: suscetibilidade do
            terreno num lugar, chuva noutro, nível de rio noutro. O FloodGuard cruza esses
            fatores numa única avaliação explicável, em vez de exigir que o operador cruze
            mentalmente fontes separadas.
          </p>
          <p className={`${P} mt-3`}>
            O piloto é <strong className={STRONG}>Blumenau/SC</strong> — município com histórico
            relevante de inundação e onde o pipeline geoespacial já foi processado sobre dados
            reais da região.
          </p>
        </Section>

        <Section id="como-funciona" title="2. Como funciona">
          <ol className="mt-2 list-inside list-decimal space-y-1.5 text-sm text-slate-400">
            <li>Uma leitura chega com posição, chuva acumulada, nível d'água e nível anterior.</li>
            <li>O motor busca o contexto espacial (classe HAND) do ponto.</li>
            <li>Os quatro fatores são normalizados e combinados num score de 0 a 100%.</li>
            <li>O score cai numa faixa e vira nível: seguro, atenção, alerta ou crítico.</li>
            <li>O motor devolve score, confiança, fatores, justificativa e ação recomendada.</li>
            <li>
              O resultado alimenta o{" "}
              <Link to="/painel" className="text-accent underline-offset-2 hover:underline">painel</Link>,
              os{" "}
              <Link to="/alertas" className="text-accent underline-offset-2 hover:underline">alertas</Link>{" "}
              e o{" "}
              <Link to="/mapa" className="text-accent underline-offset-2 hover:underline">mapa</Link>.
            </li>
          </ol>
        </Section>

        <Section id="hand" title="3. HAND">
          <p className={P}>
            <strong className={STRONG}>HAND (Height Above Nearest Drainage)</strong> mede a altura
            de um ponto em relação à drenagem mais próxima — quanto menor, maior a suscetibilidade
            a alagamento. É uma variável topográfica <strong className={STRONG}>estática</strong>:
            não incorpora chuva, vazão ou exposição por si só, e não é previsão de inundação. Entra
            como um dos quatro fatores do motor de risco.
          </p>
          <p className={`${P} mt-3`}>
            As zonas HAND do mapa ultrapassam o limite de Blumenau de propósito. Elas representam a{" "}
            <strong className={STRONG}>área hidrologicamente contribuinte</strong> usada no
            processamento, não o polígono administrativo: água não respeita divisa de município, e o
            HAND foi calculado sobre as sub-bacias que drenam para a região. Recortar pelo limite
            descartaria a bacia que de fato influencia o território. O contorno em{" "}
            <span className="font-semibold text-accent">ciano</span> marca o limite municipal.
          </p>
          <p className={`${P} mt-3`}>
            Detalhes: <code className="text-slate-500">docs/metodologia-hand.md</code> e{" "}
            <code className="text-slate-500">docs/hand-processamento-detalhado.md</code>.
          </p>
        </Section>

        <Section id="dados" title="4. Dados utilizados">
          <ul className={LIST}>
            <li>
              <strong className={STRONG}>Reais:</strong> camadas HAND de Blumenau — limite
              municipal, bacias e zonas de suscetibilidade classificadas.
            </li>
            <li>
              <strong className={STRONG}>Simulados:</strong> toda leitura de sensor (chuva, nível
              d'água), os três cenários de referência, os alertas e os abrigos.
            </li>
            <li>
              As camadas geoespaciais vêm do PostGIS quando disponível e caem para arquivos GeoJSON
              estáticos quando não — o mapa continua funcionando nos dois casos.
            </li>
          </ul>
        </Section>

        <Section id="motor" title="5. Motor de risco">
          <p className={P}>
            O motor combina <strong className={STRONG}>HAND, chuva acumulada, nível d'água e
            tendência</strong> numa fórmula transparente e auditável. Toda avaliação vem com
            decomposição por fator, justificativa textual e ação recomendada — o operador vê de
            onde o score veio, não só o número.
          </p>
          <p className={`${P} mt-3`}>
            Os limiares de faixa (0.25 / 0.50 / 0.75) e os pesos de normalização são{" "}
            <strong className={STRONG}>valores demonstrativos</strong>, não calibrados com dados
            reais de campo. A confiança cai quando falta contexto espacial ou quando a comunicação
            está degradada. Detalhes: <code className="text-slate-500">docs/motor-de-risco.md</code>.
          </p>
        </Section>

        <Section id="telemetria" title="6. Telemetria">
          <p className={P}>
            A tela de{" "}
            <Link to="/telemetria" className="text-accent underline-offset-2 hover:underline">
              Telemetria
            </Link>{" "}
            tem dois modos. "Avaliar leitura" é o console do motor: os valores são digitados
            manualmente ou carregados de um preset, nunca vêm de sensor de campo. "Fluxo de
            sensores" reproduz uma série temporal fixa de leituras chegando ao longo do tempo —
            roteiro determinístico, sempre igual, com cada leitura avaliada pelo motor de risco
            real (o nível de risco não está escrito na fixture).
          </p>
          <p className={`${P} mt-3`}>
            O botão "Gerar payload UniMesh/LoRa" mostra como uma mensagem compacta seria transmitida
            por rede mesh de baixa largura de banda. O payload é montado de verdade, mas vem marcado
            com <code className="text-slate-500">implemented: false</code>: não há transmissão real —
            a PoC é <strong className={STRONG}>software-only e hardware-agnóstica</strong>. Detalhes:{" "}
            <code className="text-slate-500">docs/telemetria-detalhada.md</code>.
          </p>
        </Section>

        <Section id="mapa" title="7. Mapa e contexto geoespacial">
          <p className={P}>
            O{" "}
            <Link to="/mapa" className="text-accent underline-offset-2 hover:underline">mapa</Link>{" "}
            sobrepõe três camadas à base cartográfica: as zonas de suscetibilidade HAND, o limite
            municipal em ciano e os marcadores de eventos e abrigos.
          </p>
          <p className={`${P} mt-3`}>
            As cores das zonas usam a mesma escala do resto da plataforma (verde a vermelho)
            aplicada à suscetibilidade — por isso a legenda fala em "muito baixa" a "alta", e não em
            "seguro" a "crítico": chamar uma zona HAND de crítica sugeriria risco em tempo real, que
            é outra coisa. Os losangos ciano são{" "}
            <Link to="/abrigos" className="text-accent underline-offset-2 hover:underline">abrigos</Link>;
            os círculos são eventos, com anel pulsante nos críticos.
          </p>
        </Section>

        <Section id="alertas" title="8. Alertas">
          <p className={P}>
            Os{" "}
            <Link to="/alertas" className="text-accent underline-offset-2 hover:underline">alertas</Link>{" "}
            são derivados do motor de risco sobre cenários fixos e não têm persistência em banco. São
            eventos de demonstração — <strong className={STRONG}>não são alertas oficiais emitidos
            pela Defesa Civil</strong>. Cada um traz gravidade, score, confiança, justificativa e
            ação recomendada, e liga direto para o ponto correspondente no mapa.
          </p>
        </Section>

        <Section id="sos" title="9. SOS e central de atendimento">
          <p className={P}>
            O fluxo completo da operação é: monitorar → identificar → priorizar → receber
            pedidos → atender → encaminhar para local seguro → acompanhar. A tela de{" "}
            <Link to="/sos" className="text-accent underline-offset-2 hover:underline">SOS</Link>{" "}
            é o lado de quem pede ajuda; a{" "}
            <Link to="/operacao" className="text-accent underline-offset-2 hover:underline">
              central de operação
            </Link>{" "}
            é onde o pedido é triado e acompanhado.
          </p>
          <p className={`${P} mt-3`}>
            O nível da água é informado por referência corporal (tornozelo, joelho, cintura…) em
            vez de metros: quem está com a casa alagando não mede a lâmina d'água. A fila ordena
            por vulnerabilidade, depois nível da água, depois tempo de espera.
          </p>
          <p className={`${P} mt-3`}>
            <strong className={STRONG}>Nada disso é persistido.</strong> Pedidos criados, mudanças
            de status e ajustes de ocupação de abrigo vivem apenas na sessão do navegador e
            desaparecem ao fechar a aba. O protocolo (SOS-2026-XXXX) é demonstrativo e nenhum
            pedido chega a qualquer órgão real.
          </p>
        </Section>

        <Section id="simulado" title="10. Dados simulados">
          <p className={P}>
            Toda a operação da plataforma roda sobre dados simulados
            (<code className="text-slate-500">source: "simulation"</code>). Não há sensores físicos,
            LoRaWAN, Meshtastic ou MQTT reais em operação, e nada é persistido em banco entre
            sessões. São fixtures: a rede de sensores e sua série temporal, os pedidos SOS, os
            abrigos e seus contatos (telefones na faixa fictícia 5550, que não completa chamada).
            Nenhum dado de pessoa real é usado.
          </p>
          <p className={`${P} mt-3`}>
            O que é real: as camadas HAND de Blumenau e o próprio motor de risco, que calcula de
            verdade a partir do que recebe — inclusive cada leitura do fluxo contínuo de sensores,
            avaliada em <code className="text-slate-500">/api/risk/evaluate-batch</code>. Nenhuma
            tela afirma o contrário: o selo{" "}
            <strong className={STRONG}>"Modo demo — dados simulados"</strong> fica visível no
            cabeçalho em todas as rotas.
          </p>
        </Section>

        <Section id="limitacoes" title="11. Limitações atuais">
          <ul className={LIST}>
            <li>Pesos e referências de normalização do motor não são calibrados com dados de campo.</li>
            <li>HAND é suscetibilidade estática: não reage a chuva em tempo real.</li>
            <li>
              Sem autenticação, sem perfis de usuário e sem trilha de auditoria — a tela{" "}
              <Link to="/acesso" className="text-accent underline-offset-2 hover:underline">
                Acesso
              </Link>{" "}
              apenas separa os contextos de uso, não protege nada.
            </li>
            <li>Alertas e abrigos vivem em memória no backend, sem persistência.</li>
            <li>
              Pedidos SOS e ajustes de abrigo existem só na sessão do navegador — recarregar em
              outra aba ou máquina não mostra o mesmo estado.
            </li>
            <li>A rede de sensores é uma fixture: não há hardware, enlace nem coleta real.</li>
            <li>Sem previsão (nowcasting): o motor avalia o presente, não projeta o futuro.</li>
            <li>Cobertura territorial limitada a Blumenau/SC.</li>
            <li>
              O FloodGuard <strong className={STRONG}>apoia</strong> a decisão da Defesa Civil — não
              a substitui. Detalhes: <code className="text-slate-500">docs/limitacoes.md</code>.
            </li>
          </ul>
        </Section>

        <Section id="arquitetura" title="12. Arquitetura e tecnologia">
          <ul className={LIST}>
            <li>
              <strong className={STRONG}>API:</strong> FastAPI (Python), com Swagger em{" "}
              <code className="text-slate-500">/docs</code>.
            </li>
            <li>
              <strong className={STRONG}>Motor de risco:</strong> módulo isolado, sem dependência de
              banco — normalização, regras, explicação e contexto espacial separados.
            </li>
            <li>
              <strong className={STRONG}>Geoespacial:</strong> PostGIS para as camadas, com fallback
              para GeoJSON estático gerado do pipeline HAND.
            </li>
            <li>
              <strong className={STRONG}>Web:</strong> React + Vite + Tailwind, mapa em Leaflet.
            </li>
            <li>
              <strong className={STRONG}>Testes:</strong> 67 testes automatizados no backend, sem
              depender de banco.
            </li>
          </ul>
        </Section>

        <Section id="proximos-passos" title="13. Próximos passos">
          <ul className={LIST}>
            <li>Nowcasting de chuva com <strong className={STRONG}>U-RNN</strong>.</li>
            <li>Integração com hardware real: LoRaWAN, Meshtastic, MQTT.</li>
            <li>Autenticação, perfis de operador e persistência de alertas.</li>
            <li>Persistir pedidos SOS com fila real, histórico e registro de atendimento.</li>
            <li>Notificar o solicitante sobre o andamento do próprio pedido.</li>
            <li>
              Persistir abrigos na tabela <code className="text-slate-500">shelters</code>, que já
              existe no schema PostGIS.
            </li>
            <li>Atualização de ocupação de abrigo em tempo real pelo operador.</li>
            <li>Fila de solicitações de cadastro de abrigo, com triagem da Defesa Civil.</li>
            <li>App do cidadão para recebimento de avisos.</li>
          </ul>
        </Section>

        <DemoNotice />
      </div>
    </div>
  );
}
