import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { CadenceTemplateForm } from "@/components/cadences/CadenceTemplateForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCadenceTemplateById } from "@/lib/data/cadences";

export const dynamic = "force-dynamic";

type CadenceEditPageProps = {
  params: Promise<{
    cadenceId: string;
  }>;
};

export default async function CadenceEditPage(props: CadenceEditPageProps) {
  const params = await props.params;
  const template = await getCadenceTemplateById(params.cadenceId);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-control text-sm font-bold text-primary hover:text-text-primary"
        href={`/app/cadences/${template.id}`}
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại chi tiết
      </Link>

      <PageHeader
        description="Chỉnh thông tin và các bước task cho template tự tạo. Quy trình đã áp dụng cho lead sẽ cần nhân bản để giữ lịch sử."
        eyebrow="Quy trình chăm sóc"
        fullBleed
        title="Sửa quy trình"
      />

      {template.isSystem ? (
        <div className="mt-6 flex gap-3 rounded-card border border-warning/25 bg-warning-soft px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none" />
          Template hệ thống không sửa trực tiếp được. Hãy quay lại chi tiết và
          dùng “Nhân bản” để tạo bản riêng.
        </div>
      ) : (
        <CadenceTemplateForm initialTemplate={template} mode="edit" />
      )}
    </div>
  );
}
