# ADR-008: No Python, No Vercel

**Status:** Accepted

**Date:** April 2026

## Context

Many AI projects default to Python (for ML libraries) and Vercel (for frontend hosting). The Beacon has no dedicated developer. Adding Python would mean maintaining a Python runtime, dependency management, and a separate deployment pipeline. Vercel would add another hosting platform.

## Decision

No Python, no Vercel. All compute runs in Supabase Edge Functions (TypeScript/Deno) or n8n workflows. Embedding generation and RAG use pgvector + Edge Functions. No ML training is performed -- all AI is via Claude API calls.

## Consequences

- **+** One runtime (TypeScript/Deno) for all server-side code
- **+** No separate hosting to manage
- **+** Edge Functions deploy with one CLI command
- **+** n8n handles all orchestration without code
- **-** TypeScript is less common for data science work
- **-** If ML training is ever needed, Python would have to be introduced
- **-** Edge Functions have a 150-second execution limit
