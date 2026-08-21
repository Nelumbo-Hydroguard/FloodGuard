/**
 * Fonte única das mensagens de alerta — e da separação entre os DOIS
 * públicos que o FloodGuard atende.
 *
 * O problema que este módulo resolve: até aqui existia UMA frase por nível
 * de risco (`recommended_action` do motor), exibida em toda tela sob o
 * rótulo genérico "Ação recomendada". Só que aquela frase sempre foi uma
 * instrução de PLANTÃO — dirigida à Defesa Civil / operador, não ao
 * cidadão. Chamar isso de "ação recomendada" numa tela pública sugeriria
 * que a plataforma está mandando a população fazer algo.
 *
 * As duas camadas:
 *
 * 1. AÇÃO OPERACIONAL RECOMENDADA — Defesa Civil / operador. Vem do motor
 *    (`recommended_action`, mesmo contrato de API de sempre); as tabelas
 *    daqui são só fallback quando o campo não veio ou o nível é
 *    desconhecido.
 *
 * 2. ORIENTAÇÃO À POPULAÇÃO — cidadão. Existe SÓ no frontend, é conteúdo
 *    DEMONSTRATIVO do protótipo e não trafega pela API nesta fase. Não
 *    inventamos contrato novo no backend para uma camada que ainda é
 *    ilustrativa.
 *
 * REGRA DE AUTORIDADE (vale para as duas camadas): o FloodGuard NÃO
 * determina evacuação, não "garante segurança" e não emite ordem. Ele
 * recomenda verificação, monitoramento e o acionamento do plano de
 * contingência *conforme validação da Defesa Civil*. Quem decide
 * deslocamento é a autoridade competente — o texto crítico fala em "caso
 * seja determinado o deslocamento", nunca "evacue".
 */

import type { RiskLevel } from "./api";
import { RISK_LEVELS_ORDERED, RISK_THEME } from "./riskTheme";

// --- Rótulos ---------------------------------------------------------
// Centralizados porque o rótulo É a correção: seis componentes escreviam
// "Ação recomendada" cada um por si, e era exatamente o rótulo genérico
// que apagava o público-alvo.

export const OPERATIONAL_ACTION_LABEL = "Ação operacional recomendada";
export const PUBLIC_GUIDANCE_LABEL = "Orientação à população";

/** Aviso obrigatório sempre que a camada cidadã aparece na tela. */
export const PUBLIC_GUIDANCE_DISCLAIMER =
  "Conteúdo demonstrativo do protótipo — não é alerta oficial da Defesa Civil.";

// --- Camada 1: operador / Defesa Civil -------------------------------

const OPERATIONAL_RECOMMENDATION: Record<RiskLevel, string> = {
  seguro: "Manter o acompanhamento da região e das fontes oficiais.",
  atencao: "Acompanhar a evolução das condições e manter a equipe atenta a novas atualizações.",
  alerta:
    "Reforçar o monitoramento da área, verificar as informações disponíveis e preparar a comunicação preventiva à população.",
  critico:
    "Priorizar a verificação da área e executar as medidas previstas no plano de contingência, conforme validação da Defesa Civil.",
};

/**
 * Versão curta para superfícies apertadas — popup do mapa e trilha lateral.
 * Não é outra recomendação: é a mesma ação, sem as subordinadas. Existe
 * porque cortar a frase longa com `line-clamp` truncava justamente a parte
 * que qualifica a ação ("conforme validação da Defesa Civil").
 */
const OPERATIONAL_RECOMMENDATION_SHORT: Record<RiskLevel, string> = {
  seguro: "Manter o acompanhamento da região.",
  atencao: "Acompanhar a evolução e manter a equipe atenta.",
  alerta: "Reforçar o monitoramento e preparar a comunicação preventiva.",
  critico: "Priorizar a verificação da área e seguir o plano de contingência.",
};

// --- Camada 2: cidadão (demonstrativa, só frontend) ------------------

/** "O QUE ESTÁ ACONTECENDO" — situação, sem número técnico. */
const PUBLIC_HEADLINE: Record<RiskLevel, string> = {
  seguro: "Sem alerta ativo para esta região.",
  atencao: "As condições da região exigem atenção.",
  alerta: "Há condições de risco na região.",
  critico: "A situação na região é crítica.",
};

/** "O QUE FAZER" — orientação ao cidadão. */
const PUBLIC_GUIDANCE: Record<RiskLevel, string> = {
  seguro:
    "Nenhum alerta ativo para esta região. Continue acompanhando os canais oficiais da Defesa Civil.",
  atencao:
    "Condições exigem atenção na região. Acompanhe as atualizações da Defesa Civil e evite áreas com sinais de alagamento.",
  alerta:
    "Atenção para condições de risco na região. Evite áreas alagadas, acompanhe as orientações da Defesa Civil e consulte os locais seguros próximos.",
  critico:
    "Situação crítica na região. Siga as orientações da Defesa Civil, não atravesse áreas alagadas e, caso seja determinado o deslocamento, utilize o local seguro indicado.",
};

// --- Fallback de nível desconhecido ----------------------------------
// Um nível fora dos 4 do contrato significa dado corrompido ou versão de
// API à frente da UI. Nos dois casos a resposta honesta é "não sei" — e
// NÃO cair em "seguro", que subestimaria um risco que pode ser real.

const UNKNOWN_LEVEL_OPERATIONAL =
  "Nível de risco não reconhecido. Verificar a origem do dado e manter o acompanhamento da região.";

const UNKNOWN_LEVEL_PUBLIC =
  "Não foi possível determinar a situação desta região. Acompanhe os canais oficiais da Defesa Civil.";

const UNKNOWN_LEVEL_HEADLINE = "Situação não determinada para esta região.";

export function isRiskLevel(value: unknown): value is RiskLevel {
  return typeof value === "string" && (RISK_LEVELS_ORDERED as string[]).includes(value);
}

/**
 * Ação operacional para a Defesa Civil.
 *
 * `fromApi` tem prioridade: o motor continua sendo a fonte de verdade e o
 * contrato `recommended_action` segue intacto. A tabela local só entra
 * quando o campo veio vazio ou o nível é desconhecido — não é uma segunda
 * verdade concorrente.
 */
export function getOperationalRecommendation(level: unknown, fromApi?: string | null): string {
  const fallback = isRiskLevel(level) ? OPERATIONAL_RECOMMENDATION[level] : UNKNOWN_LEVEL_OPERATIONAL;
  return fromApi?.trim() ? fromApi : fallback;
}

/** Ação operacional condensada — popup do mapa, trilha de alertas. */
export function getOperationalRecommendationShort(level: unknown): string {
  return isRiskLevel(level) ? OPERATIONAL_RECOMMENDATION_SHORT[level] : UNKNOWN_LEVEL_OPERATIONAL;
}

/** Orientação ao cidadão — demonstrativa. Nunca receber texto da API aqui. */
export function getPublicGuidance(level: unknown): string {
  return isRiskLevel(level) ? PUBLIC_GUIDANCE[level] : UNKNOWN_LEVEL_PUBLIC;
}

/** "O que está acontecendo" na linguagem do cidadão. */
export function getPublicHeadline(level: unknown): string {
  return isRiskLevel(level) ? PUBLIC_HEADLINE[level] : UNKNOWN_LEVEL_HEADLINE;
}

/** Rótulo do nível para a camada cidadã — mesmo vocabulário do resto da UI. */
export function getPublicLevelLabel(level: unknown): string {
  return isRiskLevel(level) ? RISK_THEME[level].label : "Indeterminado";
}
