# Admin Bootstrap

Chạy `supabase/admin-security.sql` trước để tạo bảng `admin_users`, audit log và security events.

## Tạo super_admin đầu tiên

1. Đăng ký hoặc tạo user bình thường trong SaleMap.
2. Đảm bảo `.env.local` có:

```powershell
NEXT_PUBLIC_SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

3. Set email admin trong terminal rồi chạy:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL="email-cua-ban@example.com"
npm run admin:bootstrap
```

Script tự đọc `.env.local`/`.env`, chỉ in email được bootstrap, không in service role key.

## Thu hồi quyền admin

Chạy trong Supabase SQL editor:

```sql
update public.admin_users
set is_active = false,
    disabled_at = now()
where user_id = 'USER_UUID_CAN_THU_HOI';
```

## Kiểm tra

```sql
select user_id, role, is_active, created_at, updated_at
from public.admin_users
order by updated_at desc;
```

Không commit `.env.local`, service role key hoặc email bootstrap nếu không cần.
