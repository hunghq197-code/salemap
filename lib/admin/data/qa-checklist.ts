import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const QA_STATUS_OPTIONS = ["pending", "passed", "failed", "needs_review"] as const;

export type QaStatus = (typeof QA_STATUS_OPTIONS)[number];

export type QaChecklistItem = {
  category: "launch_qa" | "product_qa";
  checkedByLabel?: string;
  checked_by?: string | null;
  checklist_key: string;
  description?: string | null;
  id?: string;
  last_checked_at?: string | null;
  name: string;
  status: QaStatus;
};

export type QaChecklistResult = {
  launchItems: QaChecklistItem[];
  productItems: QaChecklistItem[];
  schemaReady: boolean;
};

const PRODUCT_QA_ITEMS: QaChecklistItem[] = [
  ["register_account", "Đăng ký tài khoản", "User mới có thể tạo tài khoản."],
  ["login", "Đăng nhập", "User có thể đăng nhập bằng email và mật khẩu."],
  ["onboarding", "Onboarding", "User hoàn tất onboarding và vào được app."],
  ["create_lead", "Tạo lead", "User tạo lead cá nhân thủ công."],
  ["add_note", "Thêm ghi chú", "User thêm ghi chú vào lead."],
  ["create_reminder", "Tạo reminder", "User tạo lịch follow-up."],
  ["area_search", "Tìm khách theo khu vực", "Map search theo khu vực hoạt động."],
  ["route_search", "Tìm khách dọc tuyến", "Route search hoạt động."],
  ["save_place_as_lead", "Lưu địa điểm thành lead", "User lưu kết quả bản đồ thành lead."],
  ["export_csv", "Export CSV", "User xuất lead ra CSV."],
  ["copy_template", "Copy template", "User copy mẫu sale."],
  ["send_feedback", "Gửi feedback", "User gửi góp ý."],
  ["notification_center", "Notification center", "Trung tâm thông báo hoạt động."],
  ["email_reminder_cron", "Email reminder cron", "Cron nhắc follow-up chạy đúng."],
  ["upgrade_interest", "Upgrade interest", "User gửi quan tâm nâng cấp."],
  ["admin_dashboard", "Admin dashboard", "Admin xem được dashboard vận hành."],
  ["retention_cron", "Retention cron", "Cron retention cập nhật health score."],
  ["invite_code_register", "Invite code register", "Đăng ký bằng invite code hoạt động."],
].map(([checklist_key, name, description]) => ({
  category: "product_qa",
  checklist_key,
  description,
  name,
  status: "pending",
}));

const LAUNCH_QA_ITEMS: QaChecklistItem[] = [
  ["production_build_pass", "Production build pass", "npm run build pass trước khi mở rộng user."],
  ["landing_page_ok", "Landing page hoạt động", "Landing page public tải đúng."],
  ["register_login_ok", "Register/login hoạt động", "Luồng auth chính hoạt động."],
  ["invite_code_ok", "Invite code hoạt động", "Invite code hợp lệ dùng được và hết lượt bị chặn."],
  ["core_loop_ok", "Core loop hoạt động", "Lead, note và reminder chạy ổn."],
  ["map_search_ok", "Map search hoạt động", "Tìm khách quanh tôi/theo khu vực chạy ổn."],
  ["route_search_ok", "Route search hoạt động", "Tìm khách dọc tuyến chạy ổn."],
  ["quota_ok", "Quota hoạt động", "Quota cảnh báo và chặn đúng giới hạn."],
  ["feedback_ok", "Feedback hoạt động", "User gửi feedback được."],
  ["admin_ok", "Admin dashboard hoạt động", "Admin xem các màn vận hành chính."],
  ["email_reminder_cron_ok", "Email reminder cron hoạt động", "Cron email reminder không lỗi."],
  ["retention_cron_ok", "Retention cron hoạt động", "Cron retention không lỗi."],
  ["mobile_qa_pass", "Mobile QA pass", "Các màn chính không vỡ trên mobile."],
  ["pwa_manifest_valid", "PWA manifest valid", "Manifest SaleMap đúng name, start_url, display, icon và theme."],
  ["pwa_icons_ok", "PWA icons OK", "Icon 192/512 và maskable icon tải được."],
  ["pwa_sw_registered", "Service worker registered", "Service worker được register và cache app shell."],
  ["pwa_standalone_ok", "Standalone mode OK", "SaleMap mở được ở chế độ installed/standalone."],
  ["pwa_offline_banner_ok", "Offline banner OK", "Offline/online status hiển thị rõ ràng trong app."],
  ["pwa_dashboard_cache_ok", "Dashboard cache OK", "Dashboard gần đây có thể xem khi mạng yếu."],
  ["pwa_lead_list_cache_ok", "Lead list cache OK", "Danh sách lead gần đây có thể xem khi mạng yếu."],
  ["pwa_lead_detail_cache_ok", "Lead detail cache OK", "Chi tiết lead gần đây có thể xem khi mạng yếu."],
  ["pwa_draft_note_restore_ok", "Draft note restore OK", "Ghi chú đang nhập không mất khi mạng yếu."],
  ["pwa_offline_note_queue_ok", "Offline note queue OK", "Ghi chú lead tạo offline được xếp hàng chờ đồng bộ."],
  ["pwa_offline_reminder_queue_ok", "Offline reminder queue OK", "Follow-up tạo offline được xếp hàng chờ đồng bộ."],
  ["pwa_online_sync_ok", "Online sync OK", "Các thao tác offline được retry khi online."],
  ["pwa_logout_clear_cache_ok", "Logout clears offline data", "Đăng xuất xóa cache, draft và queue của user trên thiết bị."],
  ["pwa_mobile_safe_area_ok", "Mobile safe area OK", "Bottom nav và CTA không che nhau trên màn hình có safe area."],
  ["pwa_payment_not_cached", "Payment pages not cached", "Trang thanh toán không bị service worker cache."],
  ["pwa_admin_not_cached", "Admin pages not cached", "Trang admin không bị service worker cache."],
  ["privacy_page_ready", "Privacy page có đủ", "Trang chính sách bảo mật có nội dung."],
  ["terms_page_ready", "Terms page có đủ", "Trang điều khoản sử dụng có nội dung."],
  ["posthog_event_ok", "PostHog event hoạt động", "Event chính được gửi không kèm PII."],
  ["clarity_ok", "Clarity hoạt động", "Microsoft Clarity được cấu hình đúng."],
  ["supabase_rls_checked", "Supabase RLS kiểm tra", "RLS các bảng user-facing đã rà."],
  ["google_maps_key_restricted", "Google Maps key restricted", "Google Maps key đã giới hạn domain/API."],
].map(([checklist_key, name, description]) => ({
  category: "launch_qa",
  checklist_key,
  description,
  name,
  status: "pending",
}));

const DEFAULT_ITEMS = [...PRODUCT_QA_ITEMS, ...LAUNCH_QA_ITEMS];

function isQaStatus(value: string): value is QaStatus {
  return QA_STATUS_OPTIONS.includes(value as QaStatus);
}

function mergeRows(rows: QaChecklistItem[]) {
  const rowMap = new Map(rows.map((row) => [row.checklist_key, row]));
  const merged = DEFAULT_ITEMS.map((item) => ({
    ...item,
    ...(rowMap.get(item.checklist_key) ?? {}),
    category: item.category,
    description: rowMap.get(item.checklist_key)?.description ?? item.description,
    name: rowMap.get(item.checklist_key)?.name ?? item.name,
    status: isQaStatus(rowMap.get(item.checklist_key)?.status ?? "")
      ? rowMap.get(item.checklist_key)!.status
      : "pending",
  }));

  return {
    launchItems: merged.filter((item) => item.category === "launch_qa"),
    productItems: merged.filter((item) => item.category === "product_qa"),
  };
}

export async function getQaChecklist(): Promise<QaChecklistResult> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("qa_checklists")
    .select(
      "id,checklist_key,category,name,description,status,last_checked_at,checked_by",
    )
    .order("category", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return {
      ...mergeRows([]),
      schemaReady: false,
    };
  }

  return {
    ...mergeRows((data ?? []) as QaChecklistItem[]),
    schemaReady: true,
  };
}

export async function updateQaChecklistStatus(checklistKey: string, status: string) {
  const admin = await requireAdmin();
  const safeStatus = isQaStatus(status) ? status : "pending";
  const defaultItem = DEFAULT_ITEMS.find((item) => item.checklist_key === checklistKey);

  if (!defaultItem) {
    throw new Error("Unknown QA checklist item.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("qa_checklists").upsert(
    {
      category: defaultItem.category,
      checked_by: admin.userId,
      checklist_key: defaultItem.checklist_key,
      description: defaultItem.description,
      last_checked_at: new Date().toISOString(),
      name: defaultItem.name,
      status: safeStatus,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "checklist_key" },
  );

  if (error) {
    throw new Error(error.message);
  }
}
