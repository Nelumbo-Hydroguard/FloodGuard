"""
Conexão com PostgreSQL/PostGIS.

Nesta fase (F1) o engine é apenas configurado — nenhuma query real é
executada ainda. A modelagem ORM e as queries entram na F3, depois que a
matriz espacial HAND (F2) tiver sido importada e o motor de risco canônico
(techguard-sentinela) estiver autorizado — ver docs/autoria-licenca.md.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
