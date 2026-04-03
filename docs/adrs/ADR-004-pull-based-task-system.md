# ADR-004: Pull-Based Task System

**Status:** Accepted

**Date:** April 2026

## Context

Robin manages ~180 tasks across multiple projects. Traditional priority systems (High/Medium/Low) don't provide enough granularity. Cal Newport's pull-based methodology limits work-in-progress to maintain deep focus.

## Decision

Implement a pull-based task system with max 3 active tasks, 8-dimension priority scoring (Impact x2.0, Urgency x1.8, Leverage x1.5, Energy x1.5, Goals x1.2, Risk x1.0, Motivation x0.8, Frequency x0.7, minus Time x1.0), deadline proximity boosting (+20 within 7 days), and automatic Deep Work/Shallow Work classification.

## Consequences

- **+** Forces focus -- max 3 active tasks at any time
- **+** AI can auto-score new tasks based on context
- **+** Dynamic priority -- deadline boost recalculated daily
- **+** Bidirectional sync with Monday.com board (ID: 8339394119)
- **-** Complex scoring formula requires explanation to team
- **-** Depends on honest self-assessment of 8 dimensions
