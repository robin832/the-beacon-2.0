# ADR-007: Nexudus for Facility & Community

**Status:** Accepted

**Date:** April 2026

## Context

The Beacon needs a member-facing platform for bookings (desks, meeting rooms, event space), event registration, check-in tracking, and community presence ("who is in the building"). Nexudus is purpose-built for coworking/innovation hubs and includes Salto KS integration for NFC building access.

## Decision

Use Nexudus as the member-facing community platform. Nexudus owns: facility bookings, member check-ins, event registrations, and the member portal. Data syncs to Supabase via n8n for analytics and AI processing.

## Consequences

- **+** Native coworking platform features out-of-the-box
- **+** Salto KS integration for automatic check-in on badge tap
- **+** Member portal with "Who is in?" presence visibility
- **+** REST API for data sync to Supabase
- **-** Another system to maintain and sync
- **-** Member data exists in both Nexudus and Supabase (Supabase is enriched copy)
