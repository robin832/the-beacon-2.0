# ADR-003: JSONB for Matchmaking Fields

**Status:** Accepted

**Date:** April 2026

## Context

The Beacon's matchmaking engine needs to filter and match companies across ~30 multi-select dimensions (technologies, pain_points, skills, looking_for, etc.). Traditional normalized junction tables would require 30+ join tables and complex queries.

## Decision

Store all multi-select/tag fields as JSONB arrays with GIN indexes. Use PostgreSQL's `@>` containment operator for fast matching queries.

## Consequences

- **+** Simple schema -- no junction tables
- **+** Fast queries -- `WHERE technologies @> '["IoT"]'` executes in <5ms at 200 accounts
- **+** Flexible -- adding a new tag doesn't require schema changes
- **+** Natural representation for AI prompts (JSON arrays are easy to reason about)
- **-** No referential integrity on tag values (mitigated by controlled input from Monday.com dropdowns)
- **-** Harder to get "all distinct values" compared to a lookup table
