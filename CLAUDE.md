# COI Guardian — Project Context

## What This App Does
Certificate of Insurance (COI) tracking and management for construction projects. Tracks subcontractor COIs, flags expiring/expired policies, sends email reminders, and verifies coverage requirements.

## Live URL
https://slabcoitracker.vercel.app

## GitHub
https://github.com/Piolit79/coi-guardian-9e947dc1

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (edge functions + storage)
- **Database**: Supabase
- **Deployment**: Vercel
- **Built with**: Lovable

## Key Files
| File | Purpose |
|------|---------|
| `src/pages/Index.tsx` | Dashboard — stats cards, expiration alerts, calendar view, project list |
| `src/pages/Projects.tsx` | Project grid with COI counts and expiration status |
| `src/pages/ProjectDetail.tsx` | Individual project page |
| `src/pages/Files.tsx` | File management |
| `src/pages/Settings.tsx` | Email config, GC identity, coverage requirements |
| `src/pages/Login.tsx` | Auth |
| `src/components/COIDetailContent.tsx` | Main COI view — email reminder logic lives here |
| `src/components/COICard.tsx` | COI card display |
| `src/components/CreateCOIDialog.tsx` | Create new COI |
| `src/components/EditCOIDialog.tsx` | Edit existing COI |
| `src/components/MergeCOIDialog.tsx` | Merge COIs |
| `src/components/ProjectEmailTemplate.tsx` | Email template editor (subject + body, supports {subcontractor}, {project}, {policies} variables) |
| `src/components/GLPolicyViewer.tsx` | GL policy viewer |
| `src/components/PolicyReviewDialog.tsx` | Policy review |
| `src/components/DropZone.tsx` | File uploads |
| `src/components/StatusBadge.tsx` | Status visual indicators |
| `src/components/ComplianceBadge.tsx` | Compliance visual indicators |

## Email Reminder System
- Currently uses `mailto:` links — opens user's default email client
- User's email: `mhm@slabbuilders.com` (Google Workspace, IMAP-linked to standalone Outlook desktop)
- Reminder triggers: GL or Workers' Comp expired/expiring
- Template variables: `{subcontractor}`, `{project}`, `{policies}`
- Reminders are logged to Supabase after send
- **Decision (2026-03-05)**: Left as mailto for now — discussed Gmail SMTP via Nodemailer + App Password as future upgrade (Option B)

## Settings Page Features
- Master Subcontractor Agreement upload (PDF/Word)
- Expiration reminder email config (30, 15, 3 days + overdue)
- GC Identity: company name, property address, owner info
- Minimum GL coverage limit
- Workers' Comp and Additional Insured toggles

## Session Log

### 2026-03-05 (Session 1)
- Discussed email reminder feature — currently opens Outlook via mailto:
- User email: mhm@slabbuilders.com (Google Workspace, IMAP to standalone Outlook)
- Evaluated options: Outlook Web link, Gmail SMTP + Nodemailer, Resend + domain verify
- **Decision**: Leave as mailto for now. Future upgrade = Gmail SMTP + App Password (sends from real account, shows in Sent Items)
- Set up CLAUDE.md for session memory across all three projects

### 2026-03-05 (Session 3)
- No COI Guardian changes this session — focused entirely on building SLAB Ledger
- SLAB Ledger built, deployed, and live at https://slabledger.vercel.app

### 2026-03-05 (Session 2)
- **Fixed**: Send Reminder button missing on some COIs — `SendReminderButton` was not using fuzzy email matching, now consistent with `COIContactEmails` (`src/components/COIDetailContent.tsx`)
- **Added**: Active/Inactive toggle to dashboard COI detail dialog (matches ProjectDetail) — imports `useInactiveCOIs`, `Switch`, `PowerOff` in `src/pages/Index.tsx`
- **Added**: Projects default to expanded on dashboard load — `useEffect` initializes `expandedProjects` with all project IDs on first load
- **Added**: Slab Builders logo is now clickable (full reload to `/`) on both desktop and mobile (`src/components/AppSidebar.tsx`)
- **Tuned**: Expiration alerts — compact single-row layout (px-2 py-2), max-h-[274px] to show 6 clean rows aligned with calendar bottom (still iterating — last value was 274px, may need minor tweak)
- **Next**: Confirm alert height is correct with screenshot #5

## Notes
- There are two local copies: `coi-guardian` and `coi-guardian-9e947dc1` — the active one is `coi-guardian-9e947dc1`
