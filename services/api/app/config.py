"""Configuração central da API FloodGuard, lida a partir de variáveis de ambiente."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://floodguard:floodguard@localhost:5432/floodguard"
    api_port: int = 8000
    simulation_mode: bool = True


settings = Settings()
