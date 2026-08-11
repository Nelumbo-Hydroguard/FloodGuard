from datetime import datetime

from pydantic import BaseModel


class Alert(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    status: str = "active"
    created_at: datetime | None = None
    expires_at: datetime | None = None
