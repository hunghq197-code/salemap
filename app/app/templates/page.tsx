import { TemplateLibrary } from "@/components/templates/TemplateLibrary";
import { FeatureDisabledNotice } from "@/components/ui/FeatureDisabledNotice";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import {
  getFavoriteTemplateIds,
  getTemplateCategories,
  getTemplates,
} from "@/lib/data/templates";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templateLibraryEnabled = await isFeatureEnabled("template_library");
  const [categoryResult, templateResult, favoriteIds] = templateLibraryEnabled
    ? await Promise.all([
        getTemplateCategories(),
        getTemplates(),
        getFavoriteTemplateIds(),
      ])
    : [
        { items: [], schemaReady: true },
        { items: [], schemaReady: true },
        new Set<string>(),
      ];

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
        Thư viện
      </p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
        Thư viện mẫu sale
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
        Sao chép nhanh mẫu tin nhắn/kịch bản để dùng khi gọi, nhắn Zalo hoặc follow-up.
      </p>

      {templateLibraryEnabled ? (
        <TemplateLibrary
          categories={categoryResult.items}
          favoriteIds={Array.from(favoriteIds)}
          schemaReady={categoryResult.schemaReady && templateResult.schemaReady}
          templates={templateResult.items}
        />
      ) : (
        <FeatureDisabledNotice flagKey="template_library" />
      )}
    </div>
  );
}
