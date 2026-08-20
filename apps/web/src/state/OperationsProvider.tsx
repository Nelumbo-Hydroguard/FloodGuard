import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  SOS_SEQUENCE_START,
  buildInitialSosRequests,
  type SosRequest,
  type SosStatus,
} from "../data/demoOperations";
import { formatSosProtocol, nextSosStatus } from "../lib/operations";

/**
 * Estado operacional da demo — pedidos SOS e ajustes de abrigo.
 *
 * Por que existe: o pedido nasce em `/sos` e precisa aparecer na central
 * `/operacao` e no `/mapa`. Sem backend de persistência, o estado tem que
 * viver em algum lugar entre as rotas.
 *
 * Escolha: React context + `sessionStorage`. Sobrevive a navegação e F5
 * durante uma apresentação, e morre ao fechar a aba — o que é honesto com o
 * que a plataforma realmente tem hoje (nada é gravado em banco). Toda tela
 * que permite alterar estado mostra isso explicitamente ao usuário; ver
 * `SESSION_NOTICE`.
 *
 * O que este estado NÃO faz: não substitui `/api/alerts/demo`,
 * `/api/shelters/demo` nem o motor de risco. Abrigo continua vindo da API —
 * aqui ficam só as sobreposições que o operador fez na sessão.
 */

export const SESSION_NOTICE = "Alterações válidas somente nesta sessão demo.";

const STORAGE_KEY = "floodguard:operations:v1";

export interface ShelterOverride {
  /** Operador marcou o abrigo como indisponível (ou de volta a disponível). */
  unavailable?: boolean;
  /** Ocupação ajustada na sessão; ausente = usa o valor da API. */
  capacityUsed?: number;
}

interface PersistedState {
  sosRequests: SosRequest[];
  sosSequence: number;
  shelterOverrides: Record<string, ShelterOverride>;
}

interface OperationsContextValue extends PersistedState {
  createSosRequest: (input: NewSosInput) => SosRequest;
  advanceSosStatus: (id: string) => void;
  setSosStatus: (id: string, status: SosStatus) => void;
  setShelterOverride: (id: string, override: ShelterOverride) => void;
  clearShelterOverride: (id: string) => void;
  resetDemoState: () => void;
  /** True quando algo foi alterado nesta sessão — habilita o aviso/reset. */
  dirty: boolean;
}

export interface NewSosInput {
  name: string | null;
  latitude: number;
  longitude: number;
  region: string | null;
  peopleCount: number;
  waterLevel: SosRequest["waterLevel"];
  reducedMobility: boolean;
  reducedMobilityCount: number;
  description: string;
}

const OperationsContext = createContext<OperationsContextValue | null>(null);

function initialState(): PersistedState {
  return {
    sosRequests: buildInitialSosRequests(),
    sosSequence: SOS_SEQUENCE_START,
    shelterOverrides: {},
  };
}

function readStored(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!Array.isArray(parsed.sosRequests)) return null;
    return parsed;
  } catch {
    // sessionStorage indisponível (modo privado antigo, iframe restrito) ou
    // JSON corrompido: a demo continua em memória, sem quebrar a tela.
    return null;
  }
}

export function OperationsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => readStored() ?? initialState());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Persistência é conveniência, não requisito: seguir sem gravar.
    }
  }, [state]);

  const createSosRequest = useCallback((input: NewSosInput): SosRequest => {
    const request: SosRequest = {
      id: "",
      ...input,
      status: "aguardando",
      createdAt: new Date().toISOString(),
      demo: true,
    };
    let created = request;
    setState((prev) => {
      const sequence = prev.sosSequence + 1;
      created = { ...request, id: formatSosProtocol(sequence) };
      return {
        ...prev,
        sosSequence: sequence,
        sosRequests: [created, ...prev.sosRequests],
      };
    });
    setDirty(true);
    return created;
  }, []);

  const setSosStatus = useCallback((id: string, status: SosStatus) => {
    setState((prev) => ({
      ...prev,
      sosRequests: prev.sosRequests.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
    }));
    setDirty(true);
  }, []);

  const advanceSosStatus = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      sosRequests: prev.sosRequests.map((request) =>
        request.id === id ? { ...request, status: nextSosStatus(request.status) } : request,
      ),
    }));
    setDirty(true);
  }, []);

  const setShelterOverride = useCallback((id: string, override: ShelterOverride) => {
    setState((prev) => ({
      ...prev,
      shelterOverrides: {
        ...prev.shelterOverrides,
        [id]: { ...prev.shelterOverrides[id], ...override },
      },
    }));
    setDirty(true);
  }, []);

  const clearShelterOverride = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev.shelterOverrides };
      delete next[id];
      return { ...prev, shelterOverrides: next };
    });
    setDirty(true);
  }, []);

  const resetDemoState = useCallback(() => {
    setState(initialState());
    setDirty(false);
  }, []);

  const value = useMemo<OperationsContextValue>(
    () => ({
      ...state,
      createSosRequest,
      advanceSosStatus,
      setSosStatus,
      setShelterOverride,
      clearShelterOverride,
      resetDemoState,
      dirty,
    }),
    [
      state,
      createSosRequest,
      advanceSosStatus,
      setSosStatus,
      setShelterOverride,
      clearShelterOverride,
      resetDemoState,
      dirty,
    ],
  );

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperations(): OperationsContextValue {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error("useOperations precisa estar dentro de <OperationsProvider>.");
  }
  return context;
}
