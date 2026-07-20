# Release Notes - Staging Beta v0.1

## Version

Staging Beta v0.1

## Modules Enabled

- Auth
- Product app shell
- Lead core
- Notes/reminders
- Templates
- Import CSV/XLSX
- Pipeline
- Saved views
- Analytics
- Feedback
- Admin basic
- PWA offline-lite

## Modules Optional / Disabled By Default

- Payment gateway
- AI assistant
- Email notification
- Advanced map/route if Google Maps key is not configured

## Known Limitations

- SaleMap chưa phải CRM team.
- Chưa có native iOS/Android app.
- Chưa tự động gửi Zalo/email.
- Một số thống kê có thể cần rebuild.
- Import nên test bằng file nhỏ trước.
- Payment gateway chỉ bật khi payOS staging/webhook đã được verify.
- AI chỉ bật khi đã kiểm soát chi phí và privacy.

## Safety Notes

- Không nhập dữ liệu khách hàng quá nhạy cảm trong giai đoạn staging.
- Không dùng production Supabase.
- Không gửi secret qua client hoặc analytics.
- Tắt AI/payment/email nếu chưa có key thật.
