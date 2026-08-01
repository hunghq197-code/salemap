# UI Phase 2C2 Report

Ngay: 2026-08-01

## Pham vi

Phase 2C2 toi uu UI/UX cho:

- `/app/import`
- `/app/import/[jobId]`
- `/app/analytics`
- Cac component quota/usage lien quan truc tiep den import va analytics.

Khong redesign Billing, Settings hoac Admin. Khong doi schema database, RLS, payment, subscription, pipeline, cadence, dashboard, discovery, lead hoac task workflow.

## Audit truoc khi code

Da doc:

- `CODEX_HANDOFF.md`
- `UI_AUDIT_REPORT.md`
- `UI_PHASE_2A_REPORT.md`
- `UI_PHASE_2B_REPORT.md`
- `UI_PHASE_2C1_REPORT.md`

Da kiem tra:

- Import parser, field mapping, row normalization, row validation, duplicate detection, execute import.
- Import API upload, mapping, validate, execute, error CSV.
- Import jobs/rows data helpers va ownership scope theo `user_id`.
- Analytics page, sales analytics aggregation helpers, API routes, date validator.
- Shared UI primitives: `PageHeader`, `Button`, `Card`, `Badge`, `SectionHeader`, `Select`, `RadioGroup`, skeletons.
- Chart library: khong co chart dependency trong `package.json`; analytics cu dung HTML/CSS bars.

## Cau truc Import cu

- `/app/import/page.tsx` gom header, upload form, huong dan dinh dang va history table trong mot file.
- `ImportUploadForm` upload ngay qua `/api/import/leads/upload`, chua co drag/drop ro rang, offline state, file info rieng hoac stepper.
- `/app/import/[jobId]/page.tsx` doc job va 50 rows, truyen vao `ImportJobDetailClient`.
- `ImportJobDetailClient` la client component lon gom preview, mapping, validation summary, row list, duplicate strategy va execute import.
- History nam trong section cua `/app/import`; khong co route `/app/import/history` rieng.

## Cau truc Analytics cu

- `/app/analytics/page.tsx` la server page lon.
- Dung `Promise.all`, nen mot loi ngoai fallback noi bo co the lam ca page loi.
- Hien thi 8 KPI, co nhan tieng Anh nhu route searches, AI requests, exports.
- Activity, funnel, source, tag/category duoc render bang table/list/CSS bars.
- Chi co filter period/custom date; khong co source/stage/taskType filter trong data layer hien tai.

## Business logic duoc giu nguyen

- Parser CSV/XLSX van o `lib/import/parse-file.ts`.
- Auto mapping van dung `suggestFieldMapping`.
- Mapping sanitize van dung `sanitizeFieldMapping`.
- Normalize/validate row van dung `normalizeImportRow` va `validateImportLead`.
- Duplicate detection van dung server logic trong `findDuplicateLeadForUser`.
- Execute import van dung `executeImportJob`.
- Auth va ownership van qua `createAuthedSupabaseServerClient`, `.eq("user_id", userId)` va job ownership checks.
- Analytics aggregation van dung cac helper trong `lib/analytics/sales-analytics.ts`.
- Khong them chart library moi.

## File formats va gioi han

Dang ho tro:

- `.csv`
- `.xlsx`

Gioi han hien tai:

- File size: 10MB theo `IMPORT_FILE_LIMITS`.
- Rows/file: Free 5,000; Pro 20,000; Pro Plus 50,000.
- Parser cat sample con 20 rows.
- Parser gioi han mac dinh 80 cot va 5,000 ky tu moi cell.
- UI preview/detail khong render toan bo file; detail route lay toi da 50 rows moi lan.

## Duplicate strategy hien tai

Server kiem tra duplicate theo thu tu:

1. Phone
2. Email
3. Website
4. Name + address

Backend ho tro 3 lua chon va UI chi hien thi 3 lua chon nay:

- Bo qua dong trung.
- Cap nhat lead hien co.
- Van tao lead moi.

Client khong tu quyet dinh duplicate; server validate va execute lai tren job/row cua user hien tai.

## Component duoc tao moi

Import:

- `ImportStepper`
- `ImportDropzone`
- `ImportFileInfo`
- `ColumnMapping`
- `ColumnMappingRow`
- `ImportPreview`
- `ImportValidationSummary`
- `ImportConfirmation`
- `ImportProgress`
- `ImportResult`
- `ImportHistory`
- `ImportHistoryItem`
- `ImportQuotaCard`

Analytics:

- `AnalyticsPageTracker`
- `AnalyticsFilterBar`
- `AnalyticsKpiCard`
- `AnalyticsKpiGrid`
- `ChartContainer`
- `ChartEmptyState`
- `ChartErrorState`
- `ActivityTrendChart`
- `LeadFunnel`
- `LeadSourceChart`
- `PipelineDistribution`
- `TaskPerformance`
- `FollowupHealth`
- `MapDiscoveryAnalytics`
- `AnalyticsInsightPanel`
- `AudienceBreakdown`

## Component duoc refactor hoac con su dung

- `ImportUploadForm` duoc giu path cu, refactor thanh wrapper cho `ImportDropzone`.
- `ImportJobDetailClient` duoc giu path cu, refactor thanh orchestration component goi API hien co.
- `AnalyticsSkeleton` va `ImportSkeleton` duoc cap nhat theo layout moi.
- `Toast`, `PageHeader`, `SectionHeader`, `Badge`, `Select`, `RadioGroup` duoc reuse.

## Import redesign

`/app/import`:

- Header doi dung copy: "Nhap danh sach khach hang".
- Them stepper 5 buoc: file, mapping, kiem tra, xac nhan, xong.
- Dropzone co drag/drop, nut chon file, link file mau, client validation, offline state.
- File info chi hien ten file, dung luong, loai file, gioi han dong; khong hien full local path.
- Quota card hien plan, rows/file, file size, monthly rows va quota usage neu schema san sang.
- History co mobile cards va desktop table; gioi han 10 job gan nhat.

`/app/import/[jobId]`:

- Header job + stepper theo status job.
- Preview file co table desktop va card mobile.
- Mapping row hien header, sample masked nhe, select field SaleMap, status map.
- UI ngan map nhieu cot vao cung mot field bang cach clear field cu khi field moi duoc chon.
- Validation summary hien total, valid, warning, error, duplicate, expected processable rows.
- Row preview/filter chi dung query status hop le trong `IMPORT_ROW_STATUSES`.
- Confirmation hien file, totals, errors skipped, duplicate criteria, strategy va mapping summary.
- CTA ghi du lieu dung copy "Bat dau nhap du lieu" va disabled neu job chua validated/processing.
- Progress bar dua tren processed rows that, khong timer gia.
- Result phan biet completed, partial errors va failed.

## File validation va security hardening

Client:

- Kiem tra extension `.csv/.xlsx`.
- Kiem tra MIME type co trong allowlist UX.
- Kiem tra file rong va file vuot size.
- Hien safe messages.
- Khong gui file name/content/header/sample len analytics.
- Offline thi khong upload.

Server:

- Upload route van validate same-origin, rate-limit, auth, file extension, size, parser, rows.
- Upload route them check/consume quota qua `checkDailyQuota("import_rows")` va `consumeDailyQuota("import_rows")`, reuse co che quota hien co.
- Mapping route van sanitize mapping.
- Validate/execute van scope job/rows theo user hien tai.
- Error CSV duoc harden formula injection cho cell bat dau bang `=`, `+`, `-`, `@`.
- Khong luu file public, khong expose storage path/signed URL.

## Import quota

- UI doc quota qua `getDailyUsageSnapshot(["import_rows"])`.
- Upload API check quota server-side truoc khi parse/tao job va consume sau khi tao job/rows thanh cong.
- Neu quota schema chua san sang, helper hien co fallback an toan theo co che san co cua project.
- Rủi ro can product/billing review: naming hien co giua `import_rows`, `daily_usage_limits`, "luot import/thang" va `monthlyRows` chua that su dong nhat ve ngon ngu san pham.

## Analytics redesign

`/app/analytics`:

- Header doi dung copy: "Phan tich hoat dong".
- KPI giam con 6 muc quan trong: lead moi, lead da lien he, task hoan thanh, follow-up qua han, ty le chuyen doi, map searches.
- Mobile order: KPI, task performance, follow-up health, funnel, activity trend, lead source, pipeline distribution, map/insight.
- Bo nhan tieng Anh thua trong KPI cu.
- Date filter tach thanh `AnalyticsFilterBar`, chi dung period/custom date vi data layer hien tai chi ho tro cac filter nay.
- Custom date validator yeu cau from/to, khong dao ngay, toi da 93 ngay.
- Page data fetching doi sang `Promise.allSettled`; section loi khong lam crash ca page.
- Empty states khong render chart rong va co CTA den Discover/Import/Pipeline khi hop ly.
- Analytics event tracking chi gui period preset va goal count, khong gui date range/PII.

## Analytics section va data source

- KPI: `calculateSalesMetricsForUser`.
- Task Performance: `followups_created`, `followups_completed`, `overdue_followups`.
- Follow-up Health: sales metrics + `getFilteredLeadCount({ noFollowUp: true })`.
- Lead Funnel: `calculatePipelineFunnelForUser`.
- Activity Trend: `calculateDailyTrendForUser`.
- Lead Source: `calculateSourceBreakdownForUser`.
- Pipeline Distribution: aggregate funnel stages.
- Map Discovery: `near_me_searches`, `area_searches`, `route_searches`, `map_leads_saved`.
- Goals: `getPinnedSalesGoals`.
- Tags/categories: `calculateTagBreakdownForUser`, `calculateCategoryBreakdownForUser`, chi render khi co data hoac loi.

## Chart bundle va performance

- Khong cai chart library moi.
- Khong import chart library vao AppShell/Dashboard/Import.
- Chart duoc render bang HTML/CSS nhe trong route analytics.
- Cac chart co text summary/label, khong phu thuoc tooltip.
- Khong render raw leads/tasks/notes; chi dung aggregate/count co limit trong data helper hien co.
- `Promise.allSettled` giam rui ro mot chart loi lam sap page.

## Responsive va accessibility

- Stepper co `aria-current="step"` va label completed/active/pending.
- Dropzone co file input labelled qua nut chon file, touch target >= 44px.
- Offline alert dung text ro.
- Mapping select co label tren tung row.
- Preview desktop dung table semantic, mobile dung card.
- Progress bars co `role="progressbar"` va aria values.
- Analytics charts co text summary, number labels va khong chi truyen dat bang mau.
- Filter controls la native select/date input.
- Da check horizontal overflow o viewport nho.

## Loading, empty, error, offline states

- `ImportSkeleton` cap nhat theo stepper/dropzone/quota/history.
- `AnalyticsSkeleton` cap nhat theo filter, 6 KPI va section grid.
- Import offline state chan upload/import job moi.
- Analytics empty state toan trang: "Chua du du lieu de phan tich" + CTA Discover.
- Section error state: "Khong the tai phan du lieu nay."
- Import result failed/partial/completed co copy rieng.

## Test va QA

Automated:

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run security:scan`: PASS, `SECURITY SCAN PASS`.
- `npm run build`: PASS, Next generated 99 app routes.
- `npm run smoke`: PASS, 39 checks.

Viewport QA bang in-app browser local `http://127.0.0.1:3211`:

- `/app/import` at 360x800: H1 "Nhap danh sach khach hang", stepper/dropzone/quota/history render, `overflowX=false`.
- `/app/import` at 1440x900: desktop layout checked during QA, `overflowX=false`.
- `/app/analytics` at 360x800: H1 "Phan tich hoat dong", KPI/task/funnel/source sections render, `overflowX=false`.
- `/app/analytics` at 1440x900: desktop section grid render, `overflowX=false`.
- Runtime issue found and fixed during QA: server `Button` with event handler in analytics page and dropzone hydration mismatch.
- Fresh stderr after fix: clean.

Gioi han QA:

- Khong tao import job that bang upload file trong local QA de tranh ghi du lieu vao tai khoan/Supabase hien tai.
- Import detail voi job co loi/trung du lieu chua duoc screenshot bang fixture that.
- Khong luu screenshot artifact; viewport QA dung DOM/overflow checks trong in-app browser.

## Rui ro regression con lai

- Import quota language/co che nen duoc review trong Billing phase vi existing quota table la daily usage trong khi product copy co "import/thang".
- Duplicate detection hien tai co N+1 theo row nhu engine cu; phase nay khong doi engine.
- Analytics source/stage/taskType filters chua them vi data layer/API hien tai chua support aggregate dong bo; them filter gia se lam sai KPI.
- CSV sample hien co duoc giu nguyen theo project; neu can tuyet doi khong co phone/email minh hoa, nen tao template moi trong phase noi dung/file mau.

## De xuat phase Billing tiep theo

- Chuan hoa import quota: luot import/thang vs row quota/thang vs file rows/file.
- Lam ro reset period va consumption granularity trong UI Billing.
- Dong bo label `import_rows` giua constants, entitlements, dashboard quota va import quota card.
- Them fixture/manual QA rieng cho import job co duplicate/error neu co staging account an toan.
