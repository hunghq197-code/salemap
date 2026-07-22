import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { CadenceTemplateForm } from "@/components/cadences/CadenceTemplateForm";
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
        className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-ocean hover:text-ink"
        href={`/app/cadences/${template.id}`}
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại chi tiết
      </Link>

      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
        Quy trình chăm sóc
      </p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
        Sửa quy trình
      </h1>

      {template.isSystem ? (
        <div className="mt-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
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
