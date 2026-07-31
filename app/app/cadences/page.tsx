import { Info, ListChecks, PauseCircle, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { CadenceBadge, CadenceProgress } from "@/components/cadences/CadencePresentation";
import { CadenceTemplateCard } from "@/components/cadences/CadenceTemplateCard";
import { FirstRunTip } from "@/components/onboarding/FirstRunTip";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import {
  getCadenceDashboardSummary,
  getCadenceTemplates,
} from "@/lib/data/cadences";
import { listTaskLeadOptions } from "@/lib/data/tasks";
import type { CadenceTemplate } from "@/lib/types/cadences";

export const dynamic = "force-dynamic";

type CadencesPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const tabValues = ["active", "mine", "system"] as const;

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getSafeTab(value?: string) {
  return value && tabValues.includes(value as (typeof tabValues)[number])
    ? value
    : "system";
}

function filterTemplates(items: CadenceTemplate[], tab: string) {
  if (tab === "mine") {
    return items.filter((template) => !template.isSystem);
  }

  if (tab === "active") {
    return items.filter((template) => (template.activeLeadsCount ?? 0) > 0);
  }

  return items.filter((template) => template.isSystem);
}

export default async function CadencesPage(props: CadencesPageProps) {
  const searchParams = (await props.searchParams) ?? {};
  const activeTab = getSafeTab(getString(searchParams.tab));
  const [templateResult, leadOptions, cadenceSummary] = await Promise.all([
    getCadenceTemplates({ limit: 80 }),
    listTaskLeadOptions(),
    getCadenceDashboardSummary(),
  ]);
  const templates = templateResult.items;
  const systemCount = templates.filter((template) => template.isSystem).length;
  const myCount = templates.filter((template) => !template.isSystem).length;
  const activeTemplateCount = templates.filter(
    (template) => (template.activeLeadsCount ?? 0) > 0,
  ).length;
  const visibleTemplates = filterTemplates(templates, activeTab);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        actions={
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-primary-hover"
            href="/app/cadences/new"
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
            Tạo quy trình
          </Link>
        }
        description="SaleMap tạo các việc cần làm theo lịch chăm sóc. Ứng dụng không tự gửi SMS, email hay Zalo thay bạn."
        eyebrow="Sales cadence"
        fullBleed
        title="Quy trình chăm sóc"
      >
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="primary">{templates.length} template</Badge>
          <Badge tone="success">{cadenceSummary.activeCount} lead đang chạy</Badge>
          {cadenceSummary.pausedCount > 0 ? (
            <Badge tone="warning">{cadenceSummary.pausedCount} tạm dừng</Badge>
          ) : null}
        </div>
      </PageHeader>

      <FirstRunTip
        message="Quy trình chăm sóc giúp bạn tự động tạo lịch việc, nhưng không tự gửi tin nhắn. Bạn vẫn là người kiểm soát."
        storageKey="salemap:first-run-tip:cadences"
      />

      {!templateResult.schemaReady || !cadenceSummary.schemaReady ? (
        <div className="mt-6 flex gap-3 rounded-card border border-warning/25 bg-warning-soft px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none" />
          Chưa thấy bảng cadence trong Supabase. Hãy chạy `supabase/cadences.sql`,
          sau đó chạy `supabase/seed-cadence-templates.sql`.
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Template hệ thống có thể áp dụng ngay cho lead."
          icon={Sparkles}
          label="Template hệ thống"
          tone="primary"
          value={systemCount}
        />
        <StatCard
          description="Template tự tạo hoặc đã nhân bản."
          icon={ListChecks}
          label="Template của tôi"
          tone="success"
          value={myCount}
        />
        <StatCard
          description="Lead đang có cadence active."
          icon={ListChecks}
          label="Đang chạy"
          tone="warning"
          value={cadenceSummary.activeCount}
        />
        <StatCard
          description="Cadence đã hoàn thành trong tháng này."
          icon={PauseCircle}
          label="Hoàn thành tháng này"
          tone="neutral"
          value={cadenceSummary.completedThisMonth}
        />
      </section>

      {cadenceSummary.recent.length > 0 ? (
        <section className="mt-6 rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Cadence đang theo dõi</h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                Hiển thị tối đa 3 cadence active hoặc tạm dừng gần đây.
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
              href="/app/tasks"
            >
              Mở Task Center
            </Link>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {cadenceSummary.recent.map((item) => (
              <div
                className="rounded-card border border-border-soft bg-surface-muted p-3"
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-text-primary">
                      {item.templateName}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-text-muted">
                      {item.templateCategory}
                    </p>
                  </div>
                  <CadenceBadge status={item.status} />
                </div>
                <div className="mt-3">
                  <CadenceProgress
                    completedSteps={item.completedSteps}
                    status={item.status}
                    totalSteps={item.totalSteps}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <Tabs
        ariaLabel="Nhóm quy trình chăm sóc"
        className="mt-6"
        items={[
          {
            active: activeTab === "system",
            href: "/app/cadences?tab=system",
            label: `Mẫu hệ thống (${systemCount})`,
            value: "system",
          },
          {
            active: activeTab === "mine",
            href: "/app/cadences?tab=mine",
            label: `Mẫu của tôi (${myCount})`,
            value: "mine",
          },
          {
            active: activeTab === "active",
            href: "/app/cadences?tab=active",
            label: `Đang áp dụng (${activeTemplateCount})`,
            value: "active",
          },
        ]}
      />

      {visibleTemplates.length > 0 ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {visibleTemplates.map((template) => (
            <CadenceTemplateCard
              key={template.id}
              leadOptions={leadOptions}
              template={template}
            />
          ))}
        </div>
      ) : (
        <section className="mt-6 rounded-card border border-dashed border-border-soft bg-surface p-6 text-center shadow-card">
          <h2 className="text-xl font-bold text-text-primary">
            Chưa có quy trình trong nhóm này
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-text-secondary">
            Bạn có thể tạo template riêng hoặc áp dụng một mẫu hệ thống để SaleMap sinh task theo lịch.
          </p>
          <Link
            className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-base font-bold text-white"
            href="/app/cadences/new"
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
            Tạo quy trình
          </Link>
        </section>
      )}
    </div>
  );
}
