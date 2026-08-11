"""FloodGuard API — ponto de entrada FastAPI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import alerts, geo, health, risk, scenarios, shelters, telemetry

app = FastAPI(
    title="FloodGuard API",
    description="API de apoio à tomada de decisão da Defesa Civil em eventos de inundação.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(geo.router)
app.include_router(telemetry.router)
app.include_router(risk.router)
app.include_router(alerts.router)
app.include_router(shelters.router)
app.include_router(scenarios.router)
