# Phase 2E2 Subphase D - Support Ticket System

Date: 2026-08-03, Asia/Saigon.

## Scope Delivered

- Added support ticket database foundation:
  - `support_ticket_categories`
  - `support_tickets`
  - `support_ticket_messages`
  - `support_ticket_events`
- Added seeded ticket categories:
  - Account
  - Billing
  - Bug
  - How-to
  - Feature request
- Added user routes:
  - `/app/support/tickets`
  - `/app/support/tickets/[ticketId]`
- Added admin routes:
  - `/admin/tickets`
  - `/admin/tickets/[ticketId]`
- Added API mutation routes with same-origin and rate-limit guards:
  - `POST /api/support/tickets`
  - `POST /api/support/tickets/[ticketId]/messages`
  - `PATCH /api/admin/tickets/[ticketId]`
  - `POST /api/admin/tickets/[ticketId]/messages`
- Added public user replies and admin public/internal replies.
- Added assignment, priority, status transitions, first-response SLA and resolution SLA fields.
- Added user notifications when admin sends a public ticket reply.
- Added Admin Dashboard ticket KPIs and recent ticket queue.
- Added Customer CRM aggregate open ticket counts without exposing private lead data.

## Security And Privacy Decisions

- Users can only view tickets where `support_tickets.user_id = auth.uid()`.
- Users can only insert public messages on their own ticket.
- Internal notes are visible only to admin/support roles.
- Support/admin ticket mutations are server-authorized with `MANAGE_TICKETS`.
- API mutations enforce same-origin and IP rate limiting before auth.
- Admin audit logs store ticket status, priority, ticket id/code, visibility, and body length only. They do not log full ticket content.
- Ticket system does not grant support access to user lead notes, lead phone/email, task content, cadence content, or raw provider payloads.

## SLA Model

- Category rows own default priority and SLA windows.
- New tickets store immutable due timestamps:
  - `first_response_due_at`
  - `resolution_due_at`
- Admin dashboard computes:
  - open ticket count
  - breached ticket count
- Ticket detail shows due dates and assignment.

## Deferred To Later Subphases

- Email delivery for ticket replies.
- Ticket category admin create/edit UI.
- Full ticket event timeline UI.
- Attachment upload and storage bucket validation.
- SLA escalation automation.
- Macro/canned reply library.

## Validation

```powershell
npm run typecheck
npm run lint
npm run security:scan
npm run build
npm run smoke
```

Results will be recorded in `CODEX_HANDOFF.md` after the gate passes.

Results:

- Typecheck passed.
- Lint passed with 0 warnings and 0 errors.
- Security scan passed.
- Production build passed.
- Smoke test passed 44/44 checks.

## Deployment Note

Run this SQL file in Supabase after the existing setup files:

```text
supabase/support-tickets.sql
```

The app intentionally shows schema readiness warnings on the new ticket pages until this SQL is applied.
