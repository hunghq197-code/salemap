# SaleMap payOS Setup

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
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_PARTNER_CODE=
PAYMENT_PROVIDER=payos
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

`NEXT_PUBLIC_SITE_URL` duoc dung de tao:

- `returnUrl`: `/app/billing/payment/return`
- `cancelUrl`: `/app/billing/payment/cancel`
- webhook instruction URL

Khi test local, co the dat `NEXT_PUBLIC_SITE_URL` thanh domain tunnel hoac domain preview co the nhan redirect/webhook.

## 3. Chay database schema

Trong Supabase SQL Editor, chay file:

```text
supabase/payos-payment-gateway-schema.sql
```

File nay tao bang `payment_gateway_transactions` va bo sung cac cot payOS vao `payment_requests`.

## 4. Cau hinh webhook

Trong payOS dashboard, cau hinh webhook URL:

```text
https://your-domain.com/api/webhooks/payos
```

SaleMap se verify webhook signature bang `PAYOS_CHECKSUM_KEY` truoc khi cap nhat thanh toan/subscription.

## 5. Test flow

1. Dang nhap user Free Beta.
2. Vao `/app/billing`.
3. Bam thanh toan Pro hoac Pro Plus.
4. Kiem tra app tao record `payment_requests` provider `payos`.
5. Kiem tra app tao record `payment_gateway_transactions` status `pending`.
6. Kiem tra user duoc chuyen sang checkout URL cua payOS.
7. Huy thanh toan de test `/app/billing/payment/cancel`.
8. Thanh toan test de payOS gui webhook.
9. Kiem tra transaction status thanh `paid`.
10. Kiem tra `subscriptions` duoc active/renew va quota doi theo plan.

## 6. Admin sync

Admin vao:

```text
/admin/payment-gateway
```

Dung nut `Sync status` de goi payOS status API va cap nhat giao dich neu webhook ve cham.

## 7. Luu y bao mat

- Khong expose `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` ra client component.
- Webhook phai verify signature truoc khi cap nhat subscription.
- Khong kich hoat subscription neu amount khong khop.
- Webhook idempotent: payOS gui lai nhieu lan khong duoc kich hoat/gia han trung.
- Analytics khong gui email, phone, checkout URL, QR code, raw webhook payload hoac signature.
