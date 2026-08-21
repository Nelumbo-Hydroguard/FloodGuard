/**
 * Matriz de acesso dos perfis de demonstração.
 *
 * ISTO NÃO É CONTROLE DE ACESSO. Não há autenticação, sessão de servidor nem
 * verificação de identidade em lugar nenhum do FloodGuard. O que este módulo
 * decide é **qual experiência a interface monta** — quais itens aparecem na
 * navegação e qual linguagem cada tela usa. Qualquer pessoa pode trocar de
 * perfil no seletor do header a qualquer momento, de propósito: o objetivo é
 * demonstrar que o produto tem públicos distintos, não simular uma proteção
 * que não existe. Um controle real exigiria backend (ver /sobre → roadmap).
 *
 * Por que navegação e bloqueio saem do MESMO lugar: se a lista do menu
 * morasse no Layout e a regra de bloqueio no router, as duas divergiriam na
 * primeira rota nova — apareceria no menu um item que a própria tela recusa,
 * ou o contrário. Aqui a rota tem uma audiência declarada, e tanto o menu
 * quanto o portão leem essa mesma declaração.
 */

export type Role = "visitor" | "citizen" | "civil_defense";

export const ROLES: Role[] = ["visitor", "citizen", "civil_defense"];

export const DEFAULT_ROLE: Role = "visitor";

export const ROLE_LABEL: Record<Role, string> = {
  visitor: "Visitante",
  citizen: "Cidadão",
  civil_defense: "Defesa Civil",
};

/** Frase de uma linha usada no seletor e em /acesso. */
export const ROLE_SUMMARY: Record<Role, string> = {
  visitor: "Acesso às informações públicas.",
  citizen: "Informações públicas e interação demonstrativa.",
  civil_defense: "Monitoramento e operação.",
};

export const ROLE_DEMO_NOTICE = "Perfis de demonstração — autenticação real não habilitada.";

/**
 * Quem uma rota atende.
 *
 * - `public`: qualquer pessoa, sem identificação.
 * - `citizen`: exige perfil identificado na demo (cidadão ou Defesa Civil).
 * - `operational`: experiência da Defesa Civil.
 */
export type Audience = "public" | "citizen" | "operational";

/**
 * Audiência por prefixo de rota. Só o que NÃO é público entra aqui — o
 * padrão é público, porque um produto de Defesa Civil erra para o lado de
 * mostrar informação de risco, não de escondê-la.
 */
const RESTRICTED_ROUTES: Array<{ prefix: string; audience: Audience }> = [
  { prefix: "/painel", audience: "operational" },
  { prefix: "/telemetria", audience: "operational" },
  { prefix: "/operacao", audience: "operational" },
  { prefix: "/sos", audience: "citizen" },
];

export function audienceFor(pathname: string): Audience {
  const match = RESTRICTED_ROUTES.find(
    (route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`),
  );
  return match?.audience ?? "public";
}

/** Perfis que uma audiência aceita. */
function rolesFor(audience: Audience): Role[] {
  switch (audience) {
    case "operational":
      return ["civil_defense"];
    case "citizen":
      // Defesa Civil entra: a tela existe para ela, só com outro conteúdo
      // (a operação gerencia pedidos em vez de enviar um).
      return ["citizen", "civil_defense"];
    case "public":
      return ROLES;
  }
}

export function canAccess(role: Role, pathname: string): boolean {
  return rolesFor(audienceFor(pathname)).includes(role);
}

/** Perfil que o convite do portão sugere quando o acesso é negado. */
export function suggestedRoleFor(pathname: string): Role {
  return audienceFor(pathname) === "operational" ? "civil_defense" : "citizen";
}

/**
 * O perfil vê número técnico (score, confiança, fatores HAND, payload)?
 *
 * Só a Defesa Civil. Para o cidadão esses números não informam a decisão que
 * ele precisa tomar — "63% de score" não responde "posso sair de casa?" — e
 * ainda dão aparência de precisão a um protótipo com pesos não calibrados
 * (docs/limitacoes.md). O cidadão recebe nível, lugar, hora, o que está
 * acontecendo e o que fazer.
 */
export function showsTechnicalDetail(role: Role): boolean {
  return role === "civil_defense";
}

/** O perfil opera a plataforma (vs. consultá-la)? */
export function isOperator(role: Role): boolean {
  return role === "civil_defense";
}

// --- Navegação --------------------------------------------------------

export interface NavItem {
  to: string;
  label: string;
}

/**
 * Menu principal por perfil. Ordem = prioridade da persona:
 * o cidadão abre no mapa ("minha região está em risco?"); a Defesa Civil
 * abre no painel ("o que merece atenção agora?").
 */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  visitor: [
    { to: "/mapa", label: "Mapa" },
    { to: "/alertas", label: "Alertas" },
    { to: "/abrigos", label: "Abrigos" },
  ],
  citizen: [
    { to: "/mapa", label: "Mapa" },
    { to: "/alertas", label: "Alertas" },
    { to: "/abrigos", label: "Abrigos" },
    { to: "/sos", label: "SOS" },
  ],
  civil_defense: [
    { to: "/painel", label: "Painel" },
    { to: "/mapa", label: "Mapa" },
    { to: "/alertas", label: "Alertas" },
    { to: "/telemetria", label: "Telemetria" },
    { to: "/abrigos", label: "Abrigos" },
    { to: "/operacao", label: "Operação" },
  ],
};

/** Rota inicial de cada perfil — usada por /acesso e pelo seletor. */
export const HOME_BY_ROLE: Record<Role, string> = {
  visitor: "/mapa",
  citizen: "/mapa",
  civil_defense: "/painel",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}
