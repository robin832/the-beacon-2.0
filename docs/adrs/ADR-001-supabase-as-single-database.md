# ADR-001: Supabase as Single Database

**Status:** Accepted

**Date:** April 2026

## Context

The Beacon needs a database for CRM, Innovation Platform, AI embeddings, and engagement tracking. Running multiple databases creates sync overhead and data inconsistency. The team has no dedicated DBA.

## Decision

Use a single Supabase PostgreSQL database (project troftohnocgxcsvswhbo, eu-west-1) with two schemas: `public` for CRM operations (~40 tables) and `innovation` for the Innovation Maturity Platform (~7 tables). Cross-schema foreign keys enable direct queries without sync.

## Consequences

- **+** Single source of truth, no data duplication
- **+** pgvector for AI embeddings lives alongside operational data
- **+** PostgREST provides instant REST API for every table
- **+** One backup, one monitoring dashboard, one bill
- **-** Single point of failure (mitigated by Supabase 99.9% SLA)
- **-** Schema migrations must be coordinated across both schemas
