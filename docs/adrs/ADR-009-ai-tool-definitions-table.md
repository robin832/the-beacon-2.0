# ADR-009: AI Tool Definitions Table

**Status:** Accepted

**Date:** April 2026

## Context

AI capabilities evolve rapidly. Hard-coding tool definitions in Edge Functions means every new AI skill requires a code deployment. The team wants to add AI capabilities quickly without developer intervention.

## Decision

Create an `ai_tool_definitions` table that stores tool definitions (name, description, parameters_schema, implementation_type, implementation_config) read by the chat handler at runtime. Adding a new AI skill = INSERT a row, not deploying code. Implementation types: sql_query, edge_function, n8n_webhook, rest_api.

## Consequences

- **+** New AI capabilities added via database INSERT
- **+** A/B testing via version field
- **+** Role-based access via allowed_roles
- **+** Runtime discovery -- AI agents see all available tools dynamically
- **-** More complex chat handler (must parse and execute dynamic tool definitions)
- **-** Tool definitions must be carefully validated (bad SQL template = security risk)
