"""Tipos compartilhados entre schemas — evita duplicar o mesmo Literal/modelo."""

from typing import Literal

RiskLevel = Literal["seguro", "atencao", "alerta", "critico"]
