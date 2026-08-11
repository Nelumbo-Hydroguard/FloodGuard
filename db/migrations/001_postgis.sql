-- FloodGuard — habilita as extensões necessárias para o banco espacial.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid(), usado em 002_core_tables.sql
