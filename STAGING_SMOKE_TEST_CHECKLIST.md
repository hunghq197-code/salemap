# SaleMap Staging Smoke Test Checklist

Chạy checklist này sau mỗi staging deployment trước khi gửi link cho beta users.

## Public Routes

- [ ] `/`
- [ ] `/pricing` nếu route tồn tại
- [ ] `/privacy` hoặc `/chinh-sach-bao-mat`
- [ ] `/terms` hoặc `/dieu-khoan-su-dung`
- [ ] `/login`
- [ ] `/register`
- [ ] `/cam-on`
- [ ] `/beta-status` hoặc `/status`

Kỳ vọng: không trắng trang, không hydration error, CTA login/register mở đúng.

## Auth Test

- [ ] User đăng ký được.
- [ ] User login được.
- [ ] User logout được.
- [ ] Protected routes redirect về `/login` nếu chưa đăng nhập.
- [ ] Login xong redirect về `/app/dashboard`.
- [ ] `user_profiles` được tạo.
- [ ] Onboarding không loop vô hạn.
- [ ] Admin routes chặn non-admin.
- [ ] Logout clear local cache/drafts/offline queue nếu PWA đã có.

## App Routes

- [ ] `/app/dashboard`
- [ ] `/app/leads`
- [ ] `/app/leads/[leadId]`
- [ ] `/app/reminders`
- [ ] `/app/templates`
- [ ] `/app/discover`
- [ ] `/app/import`
- [ ] `/app/export`
- [ ] `/app/pipeline`
- [ ] `/app/leads/views`
- [ ] `/app/analytics`
- [ ] `/app/settings`

Kỳ vọng: route mở được hoặc hiển thị fallback thân thiện nếu module tắt.

## Admin Routes

- [ ] `/admin`
- [ ] `/admin/users`
- [ ] `/admin/beta-signups`
- [ ] `/admin/feedback`
- [ ] `/admin/usage`
- [ ] `/admin/imports`
- [ ] `/admin/data-quality`
- [ ] `/admin/lead-views`
- [ ] `/admin/sales-analytics`

Kỳ vọng: non-admin bị chặn, admin test account xem được.

## Lead Core

- [ ] Tạo lead thủ công.
- [ ] Xem lead list.
- [ ] Xem lead detail.
- [ ] Sửa lead.
- [ ] Thêm note.
- [ ] Tạo reminder.
- [ ] Complete reminder.
- [ ] Gắn tag.
- [ ] Đổi status.
- [ ] Archive lead.
- [ ] Restore nếu route/UI có hỗ trợ.

## Map / Route Safe Test

Nếu bật map:

- [ ] Vào `/app/discover`.
- [ ] Test near-me nếu browser cho location.
- [ ] Test area search.
- [ ] Save place thành lead.
- [ ] Save duplicate không tạo trùng vô hạn.
- [ ] Test route search.
- [ ] Save route place thành lead.

Nếu thiếu Google Maps key:

- [ ] Không crash.
- [ ] Hiển thị message: `Chưa cấu hình Google Maps cho môi trường này.`

## Import CSV/XLSX

- [ ] Upload CSV mẫu nhỏ.
- [ ] Preview.
- [ ] Mapping.
- [ ] Validate.
- [ ] Execute import.
- [ ] Xem lead được tạo.
- [ ] Upload file lỗi.
- [ ] Tải error CSV.
- [ ] User khác không thấy import job.

## Payment Safe Mode

Nếu payment gateway disabled:

- [ ] Billing page mở được.
- [ ] Manual payment hoặc message cấu hình hiển thị.
- [ ] Không crash vì thiếu payOS key.

Nếu bật payOS staging:

- [ ] Create payment link.
- [ ] Return page không crash.
- [ ] Cancel page không crash.
- [ ] Webhook route verify signature.
- [ ] Invalid signature không activate subscription.
- [ ] Secret không xuất hiện ở client.

## AI Safe Mode

Nếu AI disabled:

- [ ] AI menu/panel ẩn hoặc hiển thị beta closed.
- [ ] App không crash vì thiếu `AI_API_KEY`.

Nếu bật AI:

- [ ] Generate message cho lead.
- [ ] Copy output.
- [ ] Save output to note.
- [ ] Quota hoạt động.
- [ ] Prompt/output không gửi analytics.

## PWA / Mobile

- [ ] App mở tốt ở mobile width 390px.
- [ ] Bottom nav không che CTA.
- [ ] Lead detail action bar dùng được.
- [ ] Offline banner hoạt động.
- [ ] Note draft restore.
- [ ] `/app/install` mở được.
- [ ] Service worker không cache admin/payment sensitive routes.
- [ ] Logout clear cache.

## Analytics / Privacy

- [ ] PostHog chỉ track metadata.
- [ ] Không gửi lead name, phone, email, address, note content.
- [ ] Không gửi AI output.
- [ ] Không gửi payment raw payload.
- [ ] Clarity mask input chứa PII.
- [ ] Console không log PII.
- [ ] Server logs không log raw customer data không cần thiết.
