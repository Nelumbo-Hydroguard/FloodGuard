"""
Payload compacto UniMesh/LoRa simulado.

IMPORTANTE (ler antes de usar em qualquer outro contexto): este módulo NÃO
implementa LoRa, Meshtastic ou qualquer rádio real. Não há hardware, não há
transmissão física, não há socket nem porta serial aberta. É uma camada
SIMULADA que empacota um resultado de risco já calculado, do jeito que
poderia futuramente ser encaminhado por uma rede UniMesh/LoRa real — ideia
descrita no documento "Setup Técnico Inteligente" (fev/2026), nunca
implementada fisicamente.

Portado de americas_techguard_final_poc/src/mesh_simulator.py (autoria
própria, Pedro Zanette — ver docs/autoria-licenca.md), adaptado para
receber RiskEvaluationResponse do motor de risco da F3 em vez do
RiskResult/Scenario da PoC Streamlit original.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.schemas.risk import RiskEvaluationResponse
from app.schemas.telemetry import MeshPayload

# Latência simulada por nível de risco (segundos) — valor demonstrativo
# fixo, não medido de nenhum rádio real. Mesmos valores de
# americas_techguard_final_poc/src/mesh_simulator.py.
_LATENCY_BY_LEVEL_SECONDS = {
    "seguro": 2.1,
    "atencao": 3.4,
    "alerta": 4.2,
    "critico": 5.8,
}


def build_mesh_payload(risk: RiskEvaluationResponse, region: str, municipio: str = "Blumenau/SC") -> MeshPayload:
    """Monta o payload SIMULADO de comunicação UniMesh/LoRa a partir de um
    resultado de risco já calculado. Não envia nada, não abre conexão."""

    compact_payload = f"FG|{municipio}|{risk.risk_level.upper()}|{region}"

    return MeshPayload(
        protocol="FLOODGUARD-ALERT-MOCK",
        channel="UniMesh/LoRa simulated",
        status="delivered_simulated",
        risk_level=risk.risk_level,
        risk_score=risk.risk_score,
        region=region,
        recommended_action=risk.recommended_action,
        compact_payload=compact_payload,
        latency_seconds_simulated=_LATENCY_BY_LEVEL_SECONDS.get(risk.risk_level, 4.2),
        timestamp=risk.timestamp or datetime.now(timezone.utc),
        source="simulation",
        implemented=False,
        note="Camada de comunicação simulada. Não houve transmissão LoRa física.",
    )
