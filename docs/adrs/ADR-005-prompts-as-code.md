# ADR-005: Prompts as Code

**Status:** Accepted

**Date:** April 2026

## Context

The Beacon uses ~14 AI prompt templates for different capabilities (meeting briefings, email drafts, renewal reports, etc.). Prompts need to be versioned, tested, and iterated on. Embedding prompts in n8n workflow nodes makes them hard to track and compare.

## Decision

Store all AI prompt templates as markdown files in the GitHub repo (`prompts/*.md`). Templates use `{placeholder}` syntax that n8n fills with real data before sending to Claude API. The `ai_logs.prompt_hash` field tracks which version produced each output.

## Consequences

- **+** Git history tracks every prompt change
- **+** Easy to test -- paste into Claude Project with test data
- **+** Reviewable -- PRs can include prompt changes
- **+** A/B testable via prompt_hash in ai_logs
- **-** Requires n8n to fetch templates (from GitHub raw URL or knowledge_base table)
