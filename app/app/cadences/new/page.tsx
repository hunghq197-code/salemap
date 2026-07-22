import { CadenceTemplateForm } from "@/components/cadences/CadenceTemplateForm";

export const dynamic = "force-dynamic";

export default function NewCadencePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
        Quy trình chăm sóc
      </p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
        Tạo quy trình mới
      </h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
        Thiết kế các bước chăm sóc thành việc cần làm có ngày nhắc, nội dung gợi
        ý và trạng thái lead đề xuất.
      </p>
      <CadenceTemplateForm mode="create" />
    </div>
  );
}
