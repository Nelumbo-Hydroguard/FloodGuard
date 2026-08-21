import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_ROLE, isRole, type Role } from "../lib/roleAccess";

/**
 * Perfil de visualização da demonstração.
 *
 * NÃO é autenticação: não há login, senha, token nem verificação de
 * identidade. É um seletor de experiência, para mostrar como o produto se
 * organizaria para públicos diferentes. A troca é livre e instantânea.
 *
 * Persistência em `sessionStorage`, pelo mesmo motivo do OperationsProvider:
 * sobrevive à navegação e ao F5 durante uma apresentação, e some ao fechar a
 * aba. Um perfil que sobrevivesse à aba (localStorage) daria ao seletor cara
 * de sessão de usuário — exatamente a impressão que não queremos passar.
 *
 * Padrão inicial: VISITANTE. O endereço é público; presumir acesso
 * institucional em quem acabou de chegar seria a mentira mais cara desta
 * demonstração.
 */

const STORAGE_KEY = "floodguard:role:v1";

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

function readStored(): Role | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return isRole(raw) ? raw : null;
  } catch {
    // sessionStorage indisponível (modo privado antigo, iframe restrito):
    // a demo segue em memória, sem quebrar a tela.
    return null;
  }
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => readStored() ?? DEFAULT_ROLE);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, role);
    } catch {
      // Persistência é conveniência, não requisito.
    }
  }, [role]);

  const setRole = useCallback((next: Role) => setRoleState(next), []);

  const value = useMemo<RoleContextValue>(() => ({ role, setRole }), [role, setRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole precisa estar dentro de <RoleProvider>.");
  }
  return context;
}
