# n8n Workflow Backups

This directory contains exported JSON backups of n8n workflows used by The Beacon 2.0.

## How to Export a Workflow

1. Open n8n in browser
2. Navigate to the workflow
3. Click the three-dot menu (⋯) → Download
4. Save the JSON file here with a descriptive name
5. `git add` and commit

## Expected Workflows

As automations are built (Phases 9-12 of the implementation plan), export and store them here:

| Workflow | Phase | Status |
|----------|-------|--------|
| `morning-digest.json` | 10 | Planned |
| `task-priority-recalculation.json` | 9 | Planned |
| `monday-supabase-sync.json` | 9 | Planned |
| `nexudus-checkin-sync.json` | 9 | Planned |
| `meeting-briefing-pipeline.json` | 10 | Planned |
| `meeting-summary-pipeline.json` | 10 | Planned |
| `weekly-event-scan.json` | 10 | Planned |
| `engagement-score-calculation.json` | 9 | Planned |
| `renewal-deal-auto-creation.json` | 9 | Planned |
| `invoice-overdue-detection.json` | 9 | Planned |
| `news-monitoring.json` | 11 | Planned |
| `newsletter-compilation.json` | 11 | Planned |

## Naming Convention

`kebab-case-description.json` — match the automation name from the AI roadmap document.
