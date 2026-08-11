from pydantic import BaseModel


class Shelter(BaseModel):
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
