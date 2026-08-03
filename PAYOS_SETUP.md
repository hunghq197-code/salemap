# SaleMap payOS Setup

Production domain:

```text
https://salemap.io.vn
```

Webhook URL:

```text
https://salemap.io.vn/api/webhooks/payos
```

## 1. Lay thong tin payOS

1. Tao hoac dang nhap tai khoan payOS.
2. Tao kenh thanh toan cho SaleMap.
3. Lay cac gia tri trong khu vuc cau hinh API:
   - `PAYOS_CLIENT_ID`
   - `PAYOS_API_KEY`
   - `PAYOS_CHECKSUM_KEY`
   - `PAYOS_PARTNER_CODE` neu tai khoan co partner code

Khong commit `PAYOS_API_KEY` hoac `PAYOS_CHECKSUM_KEY` len Git.

## 2. Cau hinh environment

Them cac bien sau vao `.env.local` khi chay local va vao Vercel Environment Variables khi deploy:

```env
NEXT_PUBLIC_SITE_URL=https://salemap.io.vn
NEXT_PUBLIC_BILLING_ENABLED=true
BILLING_ENABLED=true
BILLING_ALLOWED_PROVIDERS=payos,vietqr_manual
BILLING_DEFAULT_PROVIDER=payos

PAYOS_ENABLED=true
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_PARTNER_CODE=

BILLING_RETURN_PATH=/app/billing/success
BILLING_CANCEL_PATH=/app/billing/cancel

CRON_SECRET=
```

`NEXT_PUBLIC_SITE_URL` duoc dung de tao:

- `returnUrl`: `/app/billing/success`
- `cancelUrl`: `/app/billing/cancel`
- webhook instruction URL

Khi test local, co the dat `NEXT_PUBLIC_SITE_URL` thanh domain tunnel hoac domain preview co the nhan redirect/webhook.

## 3. Chay database schema

Trong Supabase SQL Editor, chay file billing provider moi:

```text
supabase/billing-provider-architecture.sql
```

Neu admin payment gateway legacy bao thieu bang, chay them:

```text
supabase/payos-payment-gateway-schema.sql
```

## 4. Cau hinh webhook

Trong payOS dashboard, cau hinh webhook URL:

```text
https://salemap.io.vn/api/webhooks/payos
```

SaleMap se verify webhook signature bang `PAYOS_CHECKSUM_KEY` truoc khi cap nhat thanh toan/subscription.

Neu muon xac nhan webhook bang payOS API, goi:

```text
POST https://api-merchant.payos.vn/confirm-webhook
```

Body:

```json
{
  "webhookUrl": "https://salemap.io.vn/api/webhooks/payos"
}
```

## 5. Test flow

1. Dang nhap user Free Beta.
2. Vao `/app/billing`.
3. Chon phuong thuc payOS.
4. Bam thanh toan Pro hoac Pro Plus.
5. Kiem tra app tao record `payments` provider `payos`.
6. Kiem tra user duoc chuyen sang checkout URL cua payOS.
7. Huy thanh toan de test `/app/billing/cancel`.
8. Thanh toan test de payOS gui webhook.
9. Kiem tra `payments.status` thanh `paid`.
10. Kiem tra `subscriptions` duoc active/renew va quota doi theo plan.

## 6. Admin sync

Admin vao:

```text
/admin/payments
```

Dung reconciliation cron hoac admin payment tools de cap nhat giao dich neu webhook ve cham.

## 7. Luu y bao mat

- Khong expose `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` ra client component.
- Webhook phai verify signature truoc khi cap nhat subscription.
- Khong kich hoat subscription neu amount khong khop.
- Webhook idempotent: payOS gui lai nhieu lan khong duoc kich hoat/gia han trung.
- Analytics khong gui email, phone, checkout URL, QR code, raw webhook payload hoac signature.
