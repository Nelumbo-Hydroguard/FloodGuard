import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROLE,
  HOME_BY_ROLE,
  NAV_BY_ROLE,
  ROLES,
  audienceFor,
  canAccess,
  isOperator,
  isRole,
  showsTechnicalDetail,
  suggestedRoleFor,
} from "../roleAccess";

/**
 * Estes testes protegem a COERÊNCIA da matriz, não uma fronteira de
 * segurança — não há nenhuma (ver roleAccess.ts). O que quebraria em
 * silêncio sem eles: um item de menu apontando para uma rota que o próprio
 * perfil não abre, ou o cidadão voltando a ver número técnico.
 */

describe("audienceFor", () => {
  it("trata como pública qualquer rota não declarada", () => {
    expect(audienceFor("/mapa")).toBe("public");
    expect(audienceFor("/alertas")).toBe("public");
    expect(audienceFor("/alertas/critico")).toBe("public");
    expect(audienceFor("/abrigos")).toBe("public");
    expect(audienceFor("/sobre")).toBe("public");
    expect(audienceFor("/acesso")).toBe("public");
    expect(audienceFor("/rota-inexistente")).toBe("public");
  });

  it("marca as rotas da operação", () => {
    expect(audienceFor("/painel")).toBe("operational");
    expect(audienceFor("/telemetria")).toBe("operational");
    expect(audienceFor("/operacao")).toBe("operational");
  });

  it("marca /sos como rota de perfil identificado", () => {
    expect(audienceFor("/sos")).toBe("citizen");
  });

  it("casa por segmento inteiro, não por prefixo de string", () => {
    // "/paineis" começa com "/painel" como texto, mas é outra rota.
    expect(audienceFor("/paineis")).toBe("public");
    expect(audienceFor("/painel/detalhe")).toBe("operational");
  });
});

describe("canAccess", () => {
  it("libera as rotas compartilhadas para os três perfis", () => {
    for (const role of ROLES) {
      expect(canAccess(role, "/mapa")).toBe(true);
      expect(canAccess(role, "/alertas")).toBe(true);
      expect(canAccess(role, "/alertas/critico")).toBe(true);
      expect(canAccess(role, "/abrigos")).toBe(true);
      expect(canAccess(role, "/sobre")).toBe(true);
    }
  });

  it("reserva a operação para a Defesa Civil", () => {
    for (const path of ["/painel", "/telemetria", "/operacao"]) {
      expect(canAccess("visitor", path)).toBe(false);
      expect(canAccess("citizen", path)).toBe(false);
      expect(canAccess("civil_defense", path)).toBe(true);
    }
  });

  it("mantém /sos fora do visitante e dentro dos perfis identificados", () => {
    expect(canAccess("visitor", "/sos")).toBe(false);
    expect(canAccess("citizen", "/sos")).toBe(true);
    // Defesa Civil abre a rota, mas a tela mostra a central em vez do
    // formulário — quem opera atende pedido, não envia.
    expect(canAccess("civil_defense", "/sos")).toBe(true);
  });
});

describe("suggestedRoleFor", () => {
  it("convida para o perfil dono da área", () => {
    expect(suggestedRoleFor("/painel")).toBe("civil_defense");
    expect(suggestedRoleFor("/telemetria")).toBe("civil_defense");
    expect(suggestedRoleFor("/operacao")).toBe("civil_defense");
    expect(suggestedRoleFor("/sos")).toBe("citizen");
  });
});

describe("detalhe técnico", () => {
  it("expõe score, confiança e fatores apenas na operação", () => {
    expect(showsTechnicalDetail("visitor")).toBe(false);
    expect(showsTechnicalDetail("citizen")).toBe(false);
    expect(showsTechnicalDetail("civil_defense")).toBe(true);
  });

  it("isOperator acompanha o mesmo critério", () => {
    expect(isOperator("visitor")).toBe(false);
    expect(isOperator("citizen")).toBe(false);
    expect(isOperator("civil_defense")).toBe(true);
  });
});

describe("navegação", () => {
  it("só oferece rotas que o próprio perfil consegue abrir", () => {
    for (const role of ROLES) {
      for (const item of NAV_BY_ROLE[role]) {
        expect(canAccess(role, item.to), `${role} → ${item.to}`).toBe(true);
      }
    }
  });

  it("leva o visitante ao mapa e a Defesa Civil ao painel", () => {
    expect(HOME_BY_ROLE.visitor).toBe("/mapa");
    expect(HOME_BY_ROLE.citizen).toBe("/mapa");
    expect(HOME_BY_ROLE.civil_defense).toBe("/painel");
  });

  it("aponta cada perfil para uma casa que ele pode abrir", () => {
    for (const role of ROLES) {
      expect(canAccess(role, HOME_BY_ROLE[role]), role).toBe(true);
    }
  });

  it("não oferece SOS ao visitante nem à Defesa Civil", () => {
    const paths = (role: (typeof ROLES)[number]) => NAV_BY_ROLE[role].map((item) => item.to);
    expect(paths("visitor")).not.toContain("/sos");
    expect(paths("citizen")).toContain("/sos");
    expect(paths("civil_defense")).not.toContain("/sos");
  });

  it("dá ao visitante um menu estritamente menor que o da operação", () => {
    expect(NAV_BY_ROLE.visitor.length).toBeLessThan(NAV_BY_ROLE.civil_defense.length);
    expect(paths(NAV_BY_ROLE.visitor)).not.toContain("/painel");
    expect(paths(NAV_BY_ROLE.visitor)).not.toContain("/telemetria");
    expect(paths(NAV_BY_ROLE.visitor)).not.toContain("/operacao");
  });
});

function paths(items: Array<{ to: string }>): string[] {
  return items.map((item) => item.to);
}

describe("isRole", () => {
  it("aceita só os três identificadores do contrato", () => {
    expect(isRole("visitor")).toBe(true);
    expect(isRole("citizen")).toBe(true);
    expect(isRole("civil_defense")).toBe(true);
    expect(isRole("admin")).toBe(false);
    expect(isRole("")).toBe(false);
    expect(isRole(null)).toBe(false);
    expect(isRole(undefined)).toBe(false);
    expect(isRole(42)).toBe(false);
  });

  it("o padrão é o perfil sem identificação", () => {
    // O endereço é público: presumir acesso institucional em quem acabou de
    // chegar seria a mentira mais cara desta demonstração.
    expect(DEFAULT_ROLE).toBe("visitor");
    expect(isRole(DEFAULT_ROLE)).toBe(true);
  });
});
