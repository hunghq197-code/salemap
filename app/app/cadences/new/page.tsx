import { CadenceTemplateForm } from "@/components/cadences/CadenceTemplateForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default function NewCadencePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        description="Thiết kế các bước chăm sóc thành việc cần làm có ngày nhắc, nội dung gợi ý và trạng thái lead đề xuất."
        eyebrow="Quy trình chăm sóc"
        fullBleed
        title="Tạo quy trình mới"
      />
      <CadenceTemplateForm mode="create" />
    </div>
  );
}
