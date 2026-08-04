# Daily Work Summary - 2026-08-04

Tong hop cac noi dung da trien khai, huong dan, test va push trong ngay 2026-08-04 cho du an SaleMap.

## Tong quan

- Hoan thien them cac phan admin operations, public beta release gate va domain smoke check.
- Bo sung Google/Gmail login tren UX va luong dang ky.
- Chuyen cac truong khu vuc dang ky sang danh sach tinh/thanh Viet Nam do he thong kiem soat.
- Xay dung va nang cap CMS AI SEO Agent de tao draft bai SEO trong admin CMS.
- Bo sung Gemini API provider de CMS AI SEO Agent co the chay bang `GEMINI_API_KEY`.
- Tang cuong chan loi provider AI va log chan doan an toan tren server.
- Xu ly loi stale Server Action sau deploy tren admin dashboard.
- Huong dan cau hinh domain `salemap.io.vn`, Google Search Console, Google Analytics, PayOS/VietQR, cron secret va Gemini API.

## Commit da push trong ngay

| Commit | Noi dung |
| --- | --- |
| `bf8fd05` | Hoan thien Admin Operations Center. |
| `8d91cda` | Bo sung public beta release gate documentation. |
| `e5b04f9` | Ghi nhan domain smoke pass. |
| `8f81357` | Them Google OAuth login. |
| `b17c6bd` | Them Vietnam province selector cho dang ky/onboarding/beta signup. |
| `2b8ee78` | Them CMS SEO AI Agent ban dau. |
| `66ea143` | Tu dong hoa CMS SEO Agent: keyword planning, SEO QA gate, optional image gate. |
| `3f8bdf4` | Them Gemini AI provider cho AI text generation. |
| `ad2e4b3` | Gia co Gemini provider diagnostics va chuyen starter model sang `gemini-2.5-flash`. |
| `844b8e5` | Xu ly loi admin stale Server Action sau deploy. |

## Admin va release readiness

- Hoan thien cac module admin operations theo phase truoc do.
- Ghi nhan release gate public beta va domain smoke check.
- Them guard cho loi Next.js Server Action cu sau deploy:
  - admin error boundary phat hien message `Server Action ... was not found on the server`;
  - nut `Tai lai` se hard reload trang de lay build moi;
  - `/admin` va `/admin/:path*` duoc gan `Cache-Control: no-store, no-cache, max-age=0, must-revalidate`.

## Dang nhap Google va luong dang ky

- Them Google OAuth login UX cho dang nhap/dang ky.
- Tich hop voi Supabase OAuth callback flow.
- Ghi chu bao mat: Google OAuth client secret nam trong Supabase provider settings, khong dua vao source/frontend env.
- Dieu chinh register Google OAuth de user moi di qua onboarding nham hoan tat thong tin khu vuc.

## Khu vuc Viet Nam

- Them danh sach tinh/thanh Viet Nam trong source.
- `/register`, beta signup va onboarding dung dropdown tinh/thanh thay vi free-text.
- Validator reject gia tri khu vuc nam ngoai danh sach he thong.
- Profile/settings hien thi theo province/city da chon.

## CMS AI SEO Agent

- Tao trang `/admin/cms/ai-agent` cho admin co quyen `MANAGE_CMS`.
- Agent tao CMS post dang `draft` hoac `review`, khong auto publish.
- Nang cap pipeline:
  - nhan business goal;
  - tu lap keyword plan;
  - chon search intent;
  - tao bai viet tieng Viet theo JSON schema;
  - SEO QA gate voi nguong review score;
  - tao slug duy nhat;
  - gan audit metadata an toan.
- Optional hero image gate:
  - mac dinh tat bang `CMS_AI_IMAGE_GENERATION_ENABLED=false`;
  - neu bat, van dung OpenAI Images API qua `AI_IMAGE_API_KEY` hoac `AI_API_KEY`;
  - upload anh vao Supabase Storage bucket `CMS_MEDIA_BUCKET`.

## Gemini API

- Them provider `AI_PROVIDER=gemini`.
- Provider doc `GEMINI_API_KEY` server-side, khong dung `NEXT_PUBLIC_GEMINI_API_KEY`.
- Starter env de test free tier:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
AI_MODEL=
CMS_AI_IMAGE_GENERATION_ENABLED=false
```

- Provider goi Gemini `models.generateContent` REST API.
- CMS Agent gui `responseMimeType: "application/json"` de yeu cau JSON output.
- Them `AIProviderRequestError` de log an toan:
  - provider;
  - HTTP status;
  - provider code;
  - provider message da cat ngan.
- Khi loi xay ra, Vercel Logs co dong `CMS SEO Agent failed` de chan doan `403`, `429`, `PERMISSION_DENIED`, `RESOURCE_EXHAUSTED`, `INVALID_ARGUMENT`, v.v.

## Bao mat va secrets

- Mo rong `scripts/security-scan.mjs` de coi `GEMINI_API_KEY` la client secret.
- Checklist bao mat da nhac khong dua cac key sau vao `NEXT_PUBLIC_*`:
  - `SUPABASE_SERVICE_ROLE_KEY`;
  - `GOOGLE_MAPS_API_KEY`;
  - `PAYOS_API_KEY`;
  - `PAYOS_CHECKSUM_KEY`;
  - `AI_API_KEY`;
  - `GEMINI_API_KEY`;
  - `AI_IMAGE_API_KEY`;
  - `CRON_SECRET`.
- Admin system health da co check cho AI/Gemini/media bucket theo muc rui ro phu hop.

## Huong dan van hanh da trao doi

- Gan domain thuc te `salemap.io.vn`.
- Lien ket Google Search Console va Google Analytics.
- Ghi nhan Google Analytics measurement id nguoi dung cung cap: `G-HYELER41LR`.
- Huong dan PayOS/VietQR, webhook URL theo domain `salemap.io.vn`.
- Giai thich `CRON_SECRET` la chuoi bi mat tu tao, luu trong env va dung de bao ve cron route.
- Giai thich Gemini billing/free tier va viec `250 USD` la han muc chi tieu Tier 1, khong phai credit duoc tang khi gan the.

## Lenh test da chay trong cac dot trien khai

Da chay nhieu lan sau cac thay doi quan trong:

```powershell
npm run typecheck
npm run lint
npm run security:scan
npm run test
npm run build
```

Ket qua cac gate chinh:

- `SECURITY SCAN PASS`
- `PHASE 2E2 REGRESSION PASS`
- `MOBILE RELEASE GATE PASS`
- Next.js production build pass.

## Viec can luu y tiep theo

- Sau moi deploy, neu admin bao stale Server Action, dong tab cu hoac hard refresh `Ctrl + F5`.
- Tren Vercel Production, dung `GEMINI_MODEL=gemini-2.5-flash` de bat dau voi free tier de on hon.
- Neu CMS AI Agent van bao loi provider, xem Vercel Logs dong `CMS SEO Agent failed` de lay `status` va `providerCode`.
- Chua bat auto publish cho AI Agent; bai AI van can admin review/publish.
- Chua tich hop lay keyword truc tiep tu Google Search Console API; hien tai keyword planning la AI-assisted ideation.
