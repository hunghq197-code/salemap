import { Bot } from "lucide-react";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminAIUsage } from "@/lib/admin/data/ai-usage";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

export default async function AdminAIUsagePage() {
  const data = await getAdminAIUsage();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo dõi lượt dùng trợ lý AI, request type, lỗi và chi phí ước tính. Nội dung prompt/output không hiển thị mặc định để giảm rủi ro lộ dữ liệu nhạy cảm."
        title="AI Usage"
      />

      {!data.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
          Chưa thấy bảng ai_requests. Hãy chạy file SQL ai-sales-assistant-schema trong Supabase trước.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <AdminKpiCard
          icon={<Bot className="h-5 w-5" />}
          label="AI hôm nay"
          value={data.todayCount}
        />
        <AdminKpiCard label="AI tháng này" value={data.monthCount} />
        <AdminKpiCard label="User dùng AI" value={data.userCount} />
        <AdminKpiCard label="Phổ biến nhất" value={data.mostPopularRequestType} />
        <AdminKpiCard label="Lỗi AI" value={data.errorCount} />
        <AdminKpiCard label="Chi phí ước tính" value={formatCurrency(data.estimatedCost)} />
      </section>

      <section className="mt-8">
        <AdminTable
          empty={data.items.length === 0}
          headers={[
            "Ngày",
            "User",
            "Request type",
            "Lead?",
            "Template?",
            "Status",
            "Tokens input",
            "Tokens output",
            "Estimated cost",
            "Error code",
          ]}
        >
          {data.items.map((item) => (
            <tr key={item.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.created_at)}</td>
              <td className="min-w-[180px] px-4 py-3">
                <p className="font-bold text-ink">{item.userLabel}</p>
                <p className="text-xs text-slate-500">{item.userEmail || "Chưa có email"}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{item.request_type}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.lead_id ? "Có" : "Không"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.template_id ? "Có" : "Không"}</td>
              <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={item.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.tokens_input ?? "Chưa có"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.tokens_output ?? "Chưa có"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatCurrency(item.estimated_cost ?? 0)}</td>
              <td className="min-w-[160px] px-4 py-3 text-slate-600">{item.error_code || "Không"}</td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
