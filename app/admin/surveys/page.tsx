import { MessageSquareHeart, Star, TrendingUp } from "lucide-react";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminSurveyResults } from "@/lib/data/surveys";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
}

function preview(value?: string | null, length = 120) {
  if (!value) return "Chưa có";

  return value.length > length ? `${value.slice(0, length)}...` : value;
}

export default async function AdminSurveysPage() {
  const data = await getAdminSurveyResults();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Xem khảo sát người dùng: mức hữu ích, NPS, tín hiệu tiếp tục dùng và sẵn sàng trả phí."
        title="Surveys"
      />

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard icon={<MessageSquareHeart className="h-5 w-5" />} label="Submitted" value={data.kpis.submitted} />
        <AdminKpiCard icon={<Star className="h-5 w-5" />} label="Average rating" value={data.kpis.averageRating} />
        <AdminKpiCard icon={<TrendingUp className="h-5 w-5" />} label="Average NPS" value={data.kpis.averageNps} />
        <AdminKpiCard label="% muốn tiếp tục dùng" value={`${data.kpis.percentContinue}%`} />
        <AdminKpiCard label="% có thể trả phí" value={`${data.kpis.percentPay}%`} />
        <AdminKpiCard label="Top useful feature" value={data.kpis.topUsefulFeature} />
        <AdminKpiCard label="Top confusing part" value={data.kpis.topConfusingPart} />
      </section>

      <section className="mt-8">
        <AdminTable
          empty={data.rows.length === 0}
          headers={[
            "User",
            "Rating",
            "NPS",
            "Most useful",
            "Confusing preview",
            "Continue",
            "Pay",
            "Submitted",
          ]}
        >
          {data.rows.map((row) => (
            <tr key={row.id}>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{row.userLabel}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.rating ?? "Chưa có"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.nps_score ?? "Chưa có"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.most_useful_feature || "Chưa có"}</td>
              <td className="min-w-[260px] px-4 py-3 text-slate-600">{preview(row.most_confusing_part)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.would_continue_using || "Chưa có"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.willingness_to_pay || "Chưa có"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(row.submitted_at)}</td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
