import { Plus } from "lucide-react";
import { addManualCohortMemberAction, updateCohortMemberAction } from "@/app/admin/beta-cohorts/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import {
  getBetaCohortDetail,
  INTERVIEW_STATUS_OPTIONS,
  INVITE_STATUS_OPTIONS,
} from "@/lib/admin/data/beta-cohorts";

export const dynamic = "force-dynamic";

type AdminBetaCohortDetailPageProps = {
  params: Promise<{
    cohortId: string;
  }>;
};

const inputClass =
  "mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
}

export default async function AdminBetaCohortDetailPage(props: AdminBetaCohortDetailPageProps) {
  const params = await props.params;
  const { cohort, members } = await getBetaCohortDetail(params.cohortId);
  const addMemberAction = addManualCohortMemberAction.bind(null, params.cohortId);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description={cohort.description || "Theo dõi member, invite status, interview status và health score."}
        title={cohort.name}
      />

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Thêm member thủ công</h2>
        <form action={addMemberAction} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <AdminField label="Name"><input className={inputClass} name="name" /></AdminField>
          <AdminField label="Email"><input className={inputClass} name="email" type="email" /></AdminField>
          <AdminField label="Phone/Zalo"><input className={inputClass} name="phoneZalo" /></AdminField>
          <AdminField label="Role"><input className={inputClass} name="roleType" /></AdminField>
          <AdminField label="Industry"><input className={inputClass} name="industry" /></AdminField>
          <AdminField label="Persona"><input className={inputClass} name="personaLabel" /></AdminField>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white md:col-span-2 xl:col-span-6" type="submit">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Thêm member
          </button>
        </form>
      </section>

      <section className="mt-8">
        <AdminTable
          empty={members.length === 0}
          headers={[
            "Name",
            "Email",
            "Phone/Zalo",
            "Role",
            "Industry",
            "Persona",
            "Invite",
            "Interview",
            "Health",
            "Core / Last active",
            "Cập nhật",
          ]}
        >
          {members.map((member) => {
            const updateAction = updateCohortMemberAction.bind(null, params.cohortId, member.id);

            return (
              <tr key={member.id}>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{member.name || "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{member.email || "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{member.phone_zalo || "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{member.role_type || "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{member.industry || "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{member.persona_label || "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={member.invite_status} /></td>
                <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={member.interview_status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{member.health_score ?? 0} / {member.health_label || "unknown"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(member.last_active_at)}</td>
                <td className="px-4 py-3">
                  <form action={updateAction} className="min-w-[280px] space-y-2">
                    <select className={inputClass} defaultValue={member.invite_status || "not_invited"} name="inviteStatus">
                      {INVITE_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <select className={inputClass} defaultValue={member.interview_status || "not_scheduled"} name="interviewStatus">
                      {INTERVIEW_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <textarea className={inputClass} defaultValue={member.admin_note || ""} maxLength={1000} name="adminNote" rows={2} />
                    <button className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-ink px-3 py-2 text-sm font-bold text-white" type="submit">
                      Lưu
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </section>
    </div>
  );
}
