# ADR-010: Claude Project as Primary AI Interface

**Status:** Accepted

**Date:** April 2026

## Context

Building a custom "command center" chat interface would take weeks of development. The team needs AI access to CRM data now. Claude Projects with MCP (Model Context Protocol) connections can directly query Supabase and Monday.com.

## Decision

Use a Claude Project with MCP connections as the primary AI interface. This gives Robin immediate access to: query CRM data, get meeting prep, run matchmaking queries, and explore engagement data -- all through natural language conversation. Defer the custom command center build until the data layer is proven.

## Consequences

- **+** Immediate value -- works today with zero development
- **+** Full SQL access to Supabase via MCP
- **+** Full Monday.com access via MCP
- **+** 90% of the command center's value at 10% of the build cost
- **-** Requires Claude Pro/Team subscription
- **-** No persistent UI or saved queries (conversation-based)
- **-** Team members each need their own Claude access
