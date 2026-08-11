"""
Schema de avaliação de risco.

Placeholder da F1 — campos alinhados ao motor de risco canônico do
techguard-sentinela (pendente de autorização, ver docs/autoria-licenca.md).
"""

from pydantic import BaseModel


class RiskAssessment(BaseModel):
    station_id: str
    hand_zone_id: str | None = None
    risk_score: float
    risk_level: str
    source: str = "simulation"
