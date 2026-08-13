from pydantic import BaseModel


class Shelter(BaseModel):
    """Schema legado (F1) — alinhado à tabela `shelters` do PostGIS
    (db/migrations/002_core_tables.sql), para quando cadastro real de
    abrigos existir. Não usado pelos endpoints de demo da F7."""

    id: str
    name: str
    address: str
    capacity: int
    current_occupancy: int = 0
    status: str = "active"
    latitude: float
    longitude: float


class ShelterRequest(BaseModel):
    id: str
    requester_name: str
    shelter_name: str
    address: str
    capacity: int
    status: str = "pending"


class DemoShelter(BaseModel):
    """
    Abrigo simulado (F7) — lista fixa em memória (app/routers/shelters.py),
    sem persistência em banco e sem vínculo confirmado com instituição real.
    Nomes genéricos de propósito ("Abrigo Municipal Simulado", não o nome de
    uma escola/ginásio específico).
    """

    id: str
    name: str
    region: str
    address: str
    latitude: float
    longitude: float
    capacity_total: int
    capacity_used: int
    occupancy_percent: float
    status: str
    notes: str
    source: str = "simulation"
    simulated: bool = True


class DemoSheltersResponse(BaseModel):
    source: str = "simulation"
    shelters: list[DemoShelter]
