# UI Phase 2A Report

Ngày: 2026-07-31

## Phạm vi

Phase 2A chỉ tối ưu UI/UX cho:

- `/app/dashboard`
- `/app/discover`
- Các component shared đang render trực tiếp trong hai màn hình này.

Không thay đổi schema database, RLS, API contract, quota/payment logic, business workflow của Lead/Task/Pipeline/Cadence/Analytics/Billing/Admin.

## Bối cảnh đã kiểm tra

- Đã đọc `CODEX_HANDOFF.md` và `UI_AUDIT_REPORT.md`.
- Đã kiểm tra `git status` trước khi làm: branch `main` đang ahead `origin/main` 1 commit từ Phase 1.
- Dashboard cũ là server page lớn, nhiều widget và nhiều truy vấn phụ cùng chặn render.
- Discover cũ đã có logic search/save/quota ổn trong `DiscoverTabs`; trọng tâm Phase 2A là đổi layout, trạng thái responsive và presentation.
- Google Maps SDK không được import hoặc load trong dashboard. Dashboard chỉ điều hướng sang `/app/discover`.

## Dashboard

Đã chuyển dashboard thành luồng làm việc rõ hơn:

- Header theo ngữ cảnh trong ngày, hiển thị việc hôm nay, quá hạn và next action.
- Tối đa 4 KPI: lead đang quản lý, việc hôm nay, việc quá hạn, lead mới trong tuần.
- Widget "Việc cần làm hôm nay" ưu tiên lên đầu sau header trên mobile.
- Lead cần chú ý được gom từ task hôm nay/quá hạn và recent leads, không hiển thị note/private content.
- Quick Discovery là form/link GET sang `/app/discover?keyword=...`; không nhúng map hoặc Google Maps SDK.
- Quota/plan và activation được đưa thành block phụ, hiển thị đúng thứ tự mobile.
- Recent activity chỉ dùng tín hiệu an toàn: lead được lưu và follow-up đã lên lịch.
- Mỗi nhóm dữ liệu dashboard có fallback riêng bằng `Promise.allSettled`, tránh một widget lỗi làm hỏng toàn trang.

Thứ tự mobile đã kiểm:

1. Greeting/action
2. Today tasks
3. KPI
4. Leads attention
5. Quick discovery
6. Activation
7. Quota/plan
8. Recent activity

## Discover

Đã chuyển discover thành workspace map-first:

- Header gọn, có trạng thái feature flag và keyword được truyền từ dashboard.
- Desktop dùng split layout: panel search/results trái `360-420px`, map workspace bên phải sticky.
- Mobile có segmented tabs cho chế độ search và toggle List/Map khi có kết quả.
- Selected place panel là bottom panel trên mobile và panel nổi trong map trên desktop.
- Map toolbar có recenter, fit results, show list và "search this area"; không tự search khi pan map.
- `MapPreview` vẫn dynamic import `ssr: false`, marker data được memo hóa, marker cleanup/route cleanup được giữ.
- Discover render map shell ngay cả khi chưa có location/search; nếu Google Maps không tải được thì hiển thị thông báo an toàn, không lộ key/config detail.
- Floating feedback button được ẩn trên dashboard/discover để không che các control chính.

## Logic được giữ nguyên

- Endpoint search giữ nguyên:
  - `/api/discovery/near-me`
  - `/api/discovery/area`
  - `/api/discovery/route`
- Endpoint detail/save/task giữ nguyên:
  - `/api/discovery/place-details`
  - `/api/discovery/save-place`
  - `/api/tasks`
  - `/api/tasks/[taskId]/complete`
- Payload save place giữ nguyên các field: address, category, googleMapsUrl, latitude, longitude, name, phone, placeId, rating, routeId, routeStopId, source, userRatingsTotal, website.
- Quota handling và `QUOTA_EXCEEDED` state giữ nguyên.
- Duplicate saved place flow giữ nguyên.
- Follow-up modal và cadence modal sau khi save lead giữ nguyên.
- Analytics map/search vẫn dùng property an toàn như keyword length, radius bucket, source, count; không log raw keyword hoặc raw place payload.

## Component thay đổi/thêm

Dashboard:

- `DashboardHeader`
- `DashboardStatCard`
- `DashboardStatGrid`
- `TodayTasks`
- `LeadsRequiringAttention`
- `QuickDiscoveryCard`
- `QuotaSummary`
- `RecentActivity`

Discover:

- `DiscoverySearchTabs`
- `DiscoveryEmptyState`
- `MapToolbar`
- `PlaceDetailPanel`
- Cập nhật forms, result cards, quota bar, route summary, skeleton, map preview.

Shared trực tiếp trong Phase 2A:

- `ActivationChecklist`
- `FirstRunTip`
- `FeatureDisabledNotice`
- `FloatingFeedbackButton`

## Test và QA

Automated:

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run security:scan`: PASS
- `npm run build`: PASS
- `npm run smoke`: PASS, 39 checks

Viewport QA bằng in-app browser:

- Dashboard mobile `390x844`: render đúng thứ tự, `overflowX=false`.
- Dashboard desktop `1440x900`: 4 KPI card render 1 hàng, mỗi card khoảng 260px, `overflowX=false`.
- Discover mobile `390x844`: nhận `keyword=Nhà thuốc` vào form, tab accessible render đúng, `overflowX=false`, feedback overlay không còn che controls.
- Discover desktop `1440x900`: workspace split đúng, panel trái 420px, map shell bên phải, `overflowX=false`.

Giới hạn QA:

- Google Maps live DOM không render trong môi trường local QA này; `MapPreview` rơi vào safe error state "Không thể tải bản đồ..." như thiết kế. Cần kiểm lại bằng môi trường có browser key/referrer hợp lệ để xác nhận tiles/marker live.

## Ngoài phạm vi

Không redesign hoặc chỉnh logic cho Lead, Task, Pipeline, Cadence, Analytics, Billing, Admin. Các link/CTA chỉ điều hướng tới flow hiện có.
