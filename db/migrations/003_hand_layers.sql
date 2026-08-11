-- FloodGuard — camadas geoespaciais reais de Blumenau (F2).
--
-- Substitui municipalities/basins/rivers/hand_zones, criadas como
-- placeholder em 002_core_tables.sql, por um schema mais completo agora que
-- os artefatos HAND reais (repositório HAND, PedroZanette/Hand) foram
-- importados via services/geo/scripts/export_to_postgis.py.
--
-- Tabelas não-espaciais de 002 (users, shelters, shelter_requests, alerts,
-- telemetry_readings, risk_assessments) não são alteradas — exceto o FK de
-- risk_assessments.hand_zone_id, recriado no final deste arquivo apontando
-- para o novo hand_zones. Como risk_assessments ainda está vazia nesta fase
-- (motor de risco só entra na F3), não há dado a migrar.

ALTER TABLE IF EXISTS risk_assessments
    DROP CONSTRAINT IF EXISTS risk_assessments_hand_zone_id_fkey;

DROP TABLE IF EXISTS hand_zones CASCADE;
DROP TABLE IF EXISTS basins CASCADE;
DROP TABLE IF EXISTS rivers CASCADE;
DROP TABLE IF EXISTS municipalities CASCADE;

CREATE TABLE municipalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    ibge_code TEXT,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_municipalities_geom ON municipalities USING GIST (geom);

CREATE TABLE basins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    source TEXT NOT NULL DEFAULT 'ANA - Ottobacias',
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_basins_geom ON basins USING GIST (geom);

-- Ainda sem dados nesta fase: não há artefato de linhas de rio no
-- repositório HAND (as ottobacias são bacias/polígonos, não hidrografia
-- linear). Ver docs/metodologia-hand.md — importador de rios é item da F3.
CREATE TABLE rivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipality_id UUID REFERENCES municipalities(id),
    name TEXT,
    geom GEOMETRY(MultiLineString, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rivers_geom ON rivers USING GIST (geom);

CREATE TABLE hand_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id INTEGER NOT NULL,
    class_label TEXT NOT NULL,
    hand_min_m NUMERIC,
    hand_max_m NUMERIC,
    susceptibility TEXT NOT NULL,
    risk_weight NUMERIC NOT NULL,
    area_m2 NUMERIC,
    source TEXT NOT NULL DEFAULT 'HAND Blumenau (Periodo 6) - repositorio PedroZanette/Hand',
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hand_zones_geom ON hand_zones USING GIST (geom);

ALTER TABLE risk_assessments
    ADD CONSTRAINT risk_assessments_hand_zone_id_fkey
    FOREIGN KEY (hand_zone_id) REFERENCES hand_zones(id);
