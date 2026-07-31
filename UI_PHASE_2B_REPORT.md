# UI Phase 2B Report - Lead List, Lead Detail, Task Center

## Scope

Implemented Phase 2B only for:

- `/app/leads`
- `/app/leads/[leadId]`
- `/app/tasks`

Not redesigned in this phase:

- Dashboard / Map Discovery from Phase 2A
- Pipeline
- Cadence management pages
- Analytics
- Import / Export
- Billing
- Admin

## What Changed

### Lead List

- Reworked `/app/leads` into a clearer sales workflow page titled `Khách hàng tiềm năng`.
- Added a focused action hierarchy:
  - Primary: `Thêm lead`
  - Secondary: `Tìm khách trên bản đồ`
  - Import and utility actions moved out of the main visual weight.
- Added 4 server-backed summary metrics:
  - Total active leads
  - Follow-up today
  - Overdue follow-up
  - Interested leads
- Replaced the old large filter block with:
  - Desktop filter bar plus advanced filters
  - Mobile search row plus bottom sheet filters
- Preserved server-side filtering and URL query state.
- Fixed pagination links so page changes preserve current search/filter params.
- Added desktop table layout and mobile lead cards.
- Avoided duplicate bulk-selection inputs by rendering only one list layout per viewport.

### Lead Detail

- Reworked detail structure around a 65/35 desktop layout:
  - Main column: next action, tasks, edit form, notes, timeline, AI panel
  - Right rail: contact details, follow-up form, cadence, management actions
- Added `Next action` near the top, derived from existing open tasks only.
- Added sticky right rail on desktop for contact/actions.
- Added mobile quick action bar above the existing app bottom nav with safe-area spacing.
- Kept existing contact, directions, edit, archive, soft delete, cadence, AI, notes, and task flows.
- Added fallback handling for auxiliary lead detail sections so secondary data failures do not take down the whole detail page.
- Limited lead notes fetch to 20 on detail via an optional internal limit to avoid long mobile timeline renders.

### Task Center

- Updated `/app/tasks` to parse and preserve `tab`, `taskType`, `priority`, `status`, and `page` URL state.
- Kept task filtering server-side through the existing `getTasksForUser` helper.
- Added desktop task filter bar and mobile task filter bottom sheet.
- Added pagination for task result tabs.
- Rebalanced task cards:
  - Primary action: complete
  - Secondary action: snooze
  - Destructive cancel action moved into a menu
- Polished `no_schedule` lead list for one-handed mobile use.

### Shared UI System

- Extended `lib/design-system/status.ts` with shared tone helpers for lead status, task status, and priority.
- Updated lead and task priority/status badges to use design-system tone classes.

## Logic Preserved

- No database schema changes.
- No RLS changes.
- No quota, subscription, payment, or billing changes.
- No API contract changes.
- Existing server actions and API payload fields were preserved:
  - Lead create/update/archive/delete
  - Lead note creation
  - Lead reminder/follow-up creation
  - Task create/complete/snooze/cancel
  - Bulk lead actions
- Existing analytics events remain scoped to non-PII metadata already used by the app.

## Files Changed

- `app/app/leads/page.tsx`
- `app/app/leads/[leadId]/page.tsx`
- `app/app/tasks/page.tsx`
- `components/leads/AddNoteForm.tsx`
- `components/leads/FollowUpForm.tsx`
- `components/leads/LeadEmptyState.tsx`
- `components/leads/LeadFilterBar.tsx`
- `components/leads/LeadHeaderActions.tsx`
- `components/leads/LeadListView.tsx`
- `components/leads/LeadSummaryCards.tsx`
- `components/leads/LeadPriorityBadge.tsx`
- `components/leads/LeadStatusBadge.tsx`
- `components/leads/LeadTaskPanel.tsx`
- `components/tasks/LeadsWithoutTasksList.tsx`
- `components/tasks/QuickTaskActions.tsx`
- `components/tasks/TaskCard.tsx`
- `components/tasks/TaskCenterPage.tsx`
- `components/tasks/TaskCounts.tsx`
- `components/tasks/TaskFilterBar.tsx`
- `components/tasks/TaskList.tsx`
- `components/tasks/TaskPriorityBadge.tsx`
- `components/tasks/TaskTabs.tsx`
- `lib/data/lead-notes.ts`
- `lib/design-system/status.ts`

## Test Results

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run security:scan`: pass
- `npm run build`: pass
- `SMOKE_BASE_URL=http://127.0.0.1:3211 npm run smoke`: pass, 39 checks

Smoke was rerun against the already-running local dev server because a separate smoke server refused to start while Next dev was active on port `3211`.

## Viewport QA

Tested with Codex in-app browser against local dev server:

- Mobile `390x844` `/app/leads`
  - Header and real counts rendered.
  - Mobile filter control rendered.
  - No horizontal overflow.
  - Mobile bottom nav present.
- Mobile `390x844` `/app/leads/[leadId]`
  - Next action rendered.
  - Tasks section rendered.
  - Notes section rendered.
  - Mobile quick action bar rendered.
  - No horizontal overflow.
- Mobile `390x844` `/app/tasks`
  - Header, tabs, filters, create action rendered.
  - Mobile bottom nav present.
  - No horizontal overflow.
- Desktop `1366x900` `/app/leads`
  - Desktop table rendered.
  - Bulk checkbox count matched the visible lead count.
  - Mobile bottom nav hidden.
  - No horizontal overflow.
- Desktop `1366x900` `/app/tasks`
  - Desktop filter selects rendered.
  - Mobile bottom nav hidden.
  - No horizontal overflow.

## Notes And Risks

- `quoted` was not added as a lead status because it does not exist in the current lead status constants; the summary metric uses existing `interested` status only.
- A lead-specific task filter was not added to Task Center because the existing task query helper does not support it and Phase 2B forbids API/schema expansion.
- Lead list uses a client viewport switch to avoid duplicate bulk checkboxes between desktop table and mobile cards. This prevents bad form submissions, but desktop may briefly show the mobile layout before hydration.
- Viewport QA used the local authenticated session and current sample data. It did not exhaustively click through every modal variant.

## Suggested Phase 2C

Recommended next scope: polish cadence/task follow-up flows across `/app/cadences` and task modals, then add dedicated design QA for modal height, keyboard focus, and long Vietnamese labels on small screens.
