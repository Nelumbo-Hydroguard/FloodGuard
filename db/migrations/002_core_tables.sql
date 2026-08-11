-- FloodGuard — tabelas iniciais (F1).
-- Estrutura mínima e coerente com docs/decisoes-arquitetura.md.
-- Dados reais (HAND, bacias, rios, limite municipal) entram na F2, quando
-- os artefatos do repositório HAND forem importados via
-- services/geo/scripts/export_to_postgis.py.

CREATE TABLE IF NOT EXISTS municipalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    state VARCHAR(2) NOT NULL,
    boundary GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS basins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipality_id UUID REFERENCES municipalities(id),
    name VARCHAR(120),
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipality_id UUID REFERENCES municipalities(id),
    name VARCHAR(120),
    geom GEOMETRY(MultiLineString, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hand_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipality_id UUID REFERENCES municipalities(id),
    hand_class VARCHAR(60) NOT NULL,
    hand_min_m NUMERIC,
    hand_max_m NUMERIC,
    susceptibility_weight NUMERIC,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'operator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shelters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    address VARCHAR(255),
    capacity INTEGER NOT NULL DEFAULT 0,
    current_occupancy INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    location GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shelter_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_name VARCHAR(160) NOT NULL,
    shelter_name VARCHAR(160) NOT NULL,
    address VARCHAR(255),
    capacity INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(160) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS telemetry_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id VARCHAR(60) NOT NULL,
    water_level NUMERIC,
    rainfall NUMERIC,
    battery NUMERIC,
    communication_status VARCHAR(30),
    source VARCHAR(30) NOT NULL DEFAULT 'simulation',
    hardware_implemented BOOLEAN NOT NULL DEFAULT false,
    location GEOMETRY(Point, 4326),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id VARCHAR(60),
    hand_zone_id UUID REFERENCES hand_zones(id),
    risk_score NUMERIC,
    risk_level VARCHAR(20),
    source VARCHAR(30) NOT NULL DEFAULT 'simulation',
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
