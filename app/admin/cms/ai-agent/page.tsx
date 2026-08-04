import Link from "next/link";
import { createSeoCmsDraftAction } from "@/app/admin/cms/actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CmsSeoAgentForm } from "@/components/cms/CmsSeoAgentForm";
import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import { getCmsCategories } from "@/lib/cms/posts";

export const dynamic = "force-dynamic";

type CmsSeoAgentPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const errorMessages: Record<string, string> = {
  agent_failed: "AI Agent chưa tạo được draft lúc này. Vui lòng thử lại sau.",
  ai_not_configured: "Chưa cấu hình AI key cho server. Nếu dùng Gemini, thêm GEMINI_API_KEY.",
  ai_request_failed: "AI provider chưa phản hồi thành công. Vui lòng kiểm tra AI_PROVIDER, API key và model.",
  invalid_ai_output: "AI trả về nội dung chưa đúng định dạng CMS. Hãy thử lại với chủ đề cụ thể hơn.",
  invalid_input: "Thông tin đầu vào chưa hợp lệ.",
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CmsSeoAgentPage(props: CmsSeoAgentPageProps) {
  await requirePermission(ADMIN_PERMISSIONS.MANAGE_CMS);

  const searchParams = await props.searchParams;
  const categories = await getCmsCategories();
  const errorCode = getString(searchParams?.error);
  const errorMessage = errorCode ? errorMessages[errorCode] : "";

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Tạo bài SEO dạng review draft bằng AI để admin kiểm tra, chỉnh sửa và publish trong CMS."
        title="AI SEO Agent"
      />

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-ink"
          href="/admin/cms"
        >
          CMS
        </Link>
        <Link
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-ink"
          href="/admin/cms/posts"
        >
          Posts
        </Link>
      </div>

      {!categories.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          CMS schema chưa sẵn sàng. Hãy chạy `supabase/seo-cms.sql`.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6">
        <CmsSeoAgentForm
          action={createSeoCmsDraftAction}
          categories={categories.items}
        />
      </div>
    </div>
  );
}
