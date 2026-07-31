# UI Phase 2C1 Report - Pipeline + Sales Cadence

Ngày: 2026-07-31

## Phạm vi

Phase 2C1 chỉ tối ưu UI/UX cho:

- `/app/pipeline`
- `/app/cadences`
- `/app/cadences/[cadenceId]`
- `/app/cadences/new`
- `/app/cadences/[cadenceId]/edit`
- Cadence presentation trong Lead Detail qua `LeadCadencePanel`

Không redesign hoặc chỉnh logic cho Import, Analytics, Billing, Settings, Admin, Dashboard, Map Discovery, Lead List, Lead Detail ngoài cadence panel, hoặc Task Center.

## Bối cảnh đã kiểm tra

- Đã đọc `CODEX_HANDOFF.md`, `UI_AUDIT_REPORT.md`, `UI_PHASE_2A_REPORT.md`, `UI_PHASE_2B_REPORT.md`.
- Git status trước khi làm: working tree sạch, branch `main` đang ahead `origin/main` 3 commit từ các phase trước.
- Pipeline cũ là một board ngang cho mọi viewport, card còn hiển thị phone/note summary và chưa có stage view riêng cho mobile.
- Cadence cũ hiển thị template bằng card đơn giản, list có nhiều action cùng trọng lượng, detail render message/note gần như đầy đủ, chưa có presentation dùng chung cho cadence progress/status.

## Pipeline

Đã thay đổi:

- Header title giữ đúng `Pipeline bán hàng`, subtitle dùng count thật từ server:
  - lead đang mở
  - lead ở stage hẹn lại
  - follow-up quá hạn nếu có
- Action hierarchy:
  - Desktop: `Tìm khách`, `Bộ lọc`, primary `Thêm lead`
  - Mobile: primary `Thêm lead`, các action phụ nằm trong bottom sheet
- Summary còn 5 KPI server-backed, không thêm deal value giả.
- Desktop dùng kanban ngang chỉ trong vùng board, mỗi cột cố định khoảng 304px, header cột sticky.
- Mobile dùng stage tabs, chỉ hiển thị một stage tại một thời điểm, không ép kanban nhiều cột vào viewport 360px.
- Pipeline card bỏ phone/address/note/raw metadata; chỉ giữ:
  - tên lead
  - category/source
  - follow-up
  - task status signal
  - tối đa 2 tag và `+n`
  - cadence active nếu có
  - status dropdown và link chi tiết
- Status update giữ endpoint cũ `/api/leads/pipeline/update-status`, bỏ mutation khi thả/chọn cùng stage, rollback visual state nếu API lỗi, refresh dữ liệu khi thành công.
- Bộ lọc Pipeline chỉ nhận các param whitelist: `stage`, `source`, `followUp`, `cadence`, `tagId`, `sort`. Không nhận search text, phone hoặc address trên URL.

Logic/data preserved:

- Không thêm lead status mới như `quoted`.
- Không đổi DB schema, RLS, quota, payment, hoặc subscription.
- Không đổi payload mutation update status.
- Query card chỉ lấy metadata nhẹ; task/cadence/tag enrichment chạy batch theo lead ids đang hiển thị để tránh N+1.

## Cadence

Đã thay đổi:

- `/app/cadences` giữ title `Quy trình chăm sóc` và copy làm rõ SaleMap tạo task theo lịch, không tự gửi SMS/email/Zalo.
- Thêm tabs:
  - Mẫu hệ thống
  - Mẫu của tôi
  - Đang áp dụng
- Thêm 4 KPI server-backed cho template/cadence activity.
- Thêm block `Cadence đang theo dõi` giới hạn tối đa 3 cadence active/paused gần đây, hiển thị progress ngắn, không render full lead list.
- Cadence card không hiển thị full steps hoặc suggested message/note; chỉ có name, description, step count, duration, task/channel icons, active lead count và actions phù hợp.
- Detail page chuyển sang timeline steps, có day offset, task type, priority, suggested status label và preview message/note giới hạn `line-clamp-2`.
- Create/edit page dùng header shared và form actions sticky được offset khỏi mobile bottom nav.
- Builder có thêm nút move up/down cho từng step để reorder bằng keyboard/click, không autosave theo keypress.
- `LeadCadencePanel` dùng shared `CadenceBadge` và `CadenceProgress`.

Logic/security preserved:

- Server auth/ownership/quota enforcement trong cadence APIs giữ nguyên.
- Template hệ thống vẫn không sửa trực tiếp; custom template mới có edit/archive.
- Không log PII/template content mới.
- Apply cadence vẫn tạo reminders qua logic hiện tại; không thêm auto-send behavior.

## Component thay đổi/thêm

Thêm mới:

- `components/pipeline/PipelineFilterBar.tsx`
- `components/pipeline/PipelineHeaderActions.tsx`
- `components/cadences/CadencePresentation.tsx`
- `components/cadences/CadenceTemplateCard.tsx`

Cập nhật chính:

- `app/app/pipeline/page.tsx`
- `components/pipeline/PipelineBoard.tsx`
- `app/api/leads/pipeline/route.ts`
- `lib/data/lead-pipeline.ts`
- `lib/design-system/status.ts`
- `lib/constants/lead-pipeline.ts`
- `app/app/cadences/page.tsx`
- `app/app/cadences/[cadenceId]/page.tsx`
- `app/app/cadences/new/page.tsx`
- `app/app/cadences/[cadenceId]/edit/page.tsx`
- `components/cadences/CadenceTemplateActions.tsx`
- `components/cadences/CadenceTemplateForm.tsx`
- `components/cadences/LeadCadencePanel.tsx`
- `lib/data/cadences.ts`
- `app/app/cadences/loading.tsx`
- `components/skeletons/PipelineSkeleton.tsx`

## Responsive / Accessibility

- Pipeline mobile không còn horizontal kanban bắt buộc; stage tabs nằm trong vùng scroll riêng và card là một cột.
- Pipeline desktop horizontal scroll được giới hạn trong board, không đẩy overflow ra toàn page.
- Filter mobile dùng `BottomSheet` shared có focus trap và Escape close.
- Header actions mobile gom secondary actions vào bottom sheet.
- Card Pipeline hỗ trợ click/keyboard open detail và không chặn select/link bên trong.
- Form cadence reorder có `sr-only` label cho up/down/delete buttons.
- Sticky submit bar của cadence form được offset khỏi mobile bottom nav.

## Performance

- Pipeline card không fetch hoặc render full note/task body.
- Task signal và active cadence signal được fetch theo batch cho lead ids đang hiển thị.
- Pipeline list giới hạn `limitPerColumn` còn 40 trên page.
- Không import Google Maps SDK hoặc chart package vào Pipeline/Cadence.
- Cadence list không render full step contents; chỉ detail/apply flow mới preview steps.

## Test Results

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run security:scan`: pass
- `npm run build`: pass
- `npm run smoke`: pass, 39 checks

## Viewport QA

Automated headless viewport QA was attempted with system Chrome against `http://127.0.0.1:3211/app/pipeline` at `390x844`.

- Result: redirected to `/login` because the fresh Playwright context had no authenticated SaleMap session.
- No repo-local test credential was found.
- Authenticated visual QA for `/app/pipeline` and `/app/cadences` still needs a browser session with a signed-in user.

Build, lint, typecheck, security scan, and smoke all passed.

## Risks / Follow-up

- Pipeline `stage` URL param controls the focused stage view; the board still fetches all pipeline columns so desktop users keep full kanban context.
- `cadence=none` excludes leads that have active/paused cadence using existing `lead_cadences`; if cadence schema is absent, the filter falls back safely.
- Pipeline task/cadence signal queries cap fetched metadata to protect page load. Very large accounts may need explicit per-stage pagination in a later phase.
- Cadence active lead counts are count-only; no full active lead list is added in this phase.

## Suggested Phase 2C2

- Add authenticated Playwright storage state for private app viewport QA.
- Add per-stage pagination/lazy loading for large pipeline accounts.
- Add a dedicated active cadence management view with limited lead rows and server pagination.
- Polish apply cadence modal height/focus states and long template names on smaller Android widths.
