import { useEffect, useMemo, useState } from "react";
import { fetchDemoShelters, type DemoShelter } from "./api";
import { SHELTER_CONTACTS, resolveTimestamp, type ShelterContact } from "../data/demoOperations";
import { shelterAvailability, type OccupancyLevel } from "./operations";
import { useOperations, type ShelterOverride } from "../state/OperationsProvider";

/**
 * Abrigo "operacional" = o que a API devolve + contato demo + ajustes que o
 * operador fez na sessão.
 *
 * Camadas, na ordem em que vencem:
 *   1. `/api/shelters/demo`  — capacidade, ocupação, endereço, status.
 *   2. `SHELTER_CONTACTS`    — telefone, acessibilidade, nota, atualização
 *                              (campos que a API ainda não expõe).
 *   3. `ShelterOverride`     — o que o operador mexeu em `/operacao`, só
 *                              nesta sessão.
 *
 * A faixa de ocupação (normal → lotado) é sempre RECALCULADA a partir da
 * ocupação vigente — nunca lida do campo `status` textual da API. O `status`
 * só decide uma coisa: se o abrigo está recebendo gente (`indisponivel`).
 */

export interface OperationalShelter extends DemoShelter {
  contact: ShelterContact | null;
  /** Ocupação em vigor (override da sessão, se houver). */
  currentUsed: number;
  percent: number;
  free: number;
  level: OccupancyLevel | "indisponivel";
  levelLabel: string;
  unavailable: boolean;
  /** True quando o operador mexeu neste abrigo nesta sessão. */
  overridden: boolean;
  updatedAtIso: string | null;
}

export function toOperationalShelter(
  shelter: DemoShelter,
  override: ShelterOverride | undefined,
  reference: number,
): OperationalShelter {
  const contact = SHELTER_CONTACTS[shelter.id] ?? null;
  const currentUsed = override?.capacityUsed ?? shelter.capacity_used;
  const unavailable = override?.unavailable ?? shelter.status === "indisponivel";
  const availability = shelterAvailability({
    capacityUsed: currentUsed,
    capacityTotal: shelter.capacity_total,
    unavailable,
  });

  return {
    ...shelter,
    contact,
    currentUsed,
    percent: availability.percent,
    free: availability.free,
    level: availability.level,
    levelLabel: availability.label,
    unavailable,
    overridden: override !== undefined,
    updatedAtIso: contact ? resolveTimestamp(contact.updatedMinutesAgo, reference) : null,
  };
}

export interface SheltersState {
  shelters: OperationalShelter[];
  loading: boolean;
  error: string | null;
  totals: { capacity: number; occupied: number; free: number; available: number };
}

export function useOperationalShelters(): SheltersState {
  const { shelterOverrides } = useOperations();
  const [raw, setRaw] = useState<DemoShelter[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Instante único por montagem: sem isso, cada render recalcularia
  // "há X min" contra um relógio diferente e o texto piscaria.
  const [reference] = useState(() => Date.now());

  useEffect(() => {
    fetchDemoShelters()
      .then((data) => setRaw(data.shelters))
      .catch(() => setError("Sem resposta da API de abrigos. Verifique se o backend está no ar."));
  }, []);

  return useMemo(() => {
    const shelters = (raw ?? []).map((shelter) =>
      toOperationalShelter(shelter, shelterOverrides[shelter.id], reference),
    );
    const usable = shelters.filter((s) => !s.unavailable);
    return {
      shelters,
      loading: raw === null && error === null,
      error,
      totals: {
        capacity: shelters.reduce((sum, s) => sum + s.capacity_total, 0),
        occupied: shelters.reduce((sum, s) => sum + s.currentUsed, 0),
        free: usable.reduce((sum, s) => sum + s.free, 0),
        available: usable.length,
      },
    };
  }, [raw, error, shelterOverrides, reference]);
}
