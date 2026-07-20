"use client";

import {
  Check,
  Copy,
  Eye,
  Heart,
  Info,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import {
  trackBetaChecklistItemCompleted,
  trackTemplateCopied,
  trackTemplateFavorited,
  trackTemplateFiltered,
  trackTemplateLibraryViewed,
  trackTemplateSearched,
  trackTemplateUnfavorited,
  trackTemplateViewed,
} from "@/lib/analytics/client";
import type { TemplateCategoryRecord, TemplateRecord } from "@/lib/data/templates";

type TemplateLibraryProps = {
  categories: TemplateCategoryRecord[];
  favoriteIds: string[];
  schemaReady: boolean;
  templates: TemplateRecord[];
};

type ToastState = {
  tone: "error" | "success";
  message: string;
} | null;

function getChannelLabel(channel?: string | null) {
  const labels: Record<string, string> = {
    direct: "Trực tiếp",
    email: "Email",
    facebook: "Facebook",
    other: "Khác",
    phone: "Điện thoại",
    zalo: "Zalo",
  };

  return labels[channel || ""] || "Khác";
}

function getTemplateTypeLabel(type?: string | null) {
  const labels: Record<string, string> = {
    appointment: "Hẹn lịch",
    call_script: "Kịch bản gọi",
    email: "Email",
    follow_up: "Follow-up",
    objection_handling: "Xử lý từ chối",
    other: "Khác",
    quote_follow_up: "Theo báo giá",
    zalo_message: "Tin nhắn Zalo",
  };

  return labels[type || ""] || "Khác";
}

function getTrackingProps(template: TemplateRecord) {
  return {
    categorySlug: template.category?.slug,
    channel: template.channel || undefined,
    templateType: template.template_type,
  };
}

export function TemplateLibrary({
  categories,
  favoriteIds,
  schemaReady,
  templates,
}: TemplateLibraryProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [copiedId, setCopiedId] = useState("");
  const [favorites, setFavorites] = useState(new Set(favoriteIds));
  const [query, setQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRecord | null>(null);
  const [showAIPersonalizer, setShowAIPersonalizer] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [updatingFavoriteId, setUpdatingFavoriteId] = useState("");

  useEffect(() => {
    trackTemplateLibraryViewed();
  }, []);

  const filteredTemplates = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesQuery =
        !cleanQuery ||
        template.title.toLowerCase().includes(cleanQuery) ||
        template.description?.toLowerCase().includes(cleanQuery) ||
        template.content.toLowerCase().includes(cleanQuery) ||
        template.situation?.toLowerCase().includes(cleanQuery);

      if (!matchesQuery) {
        return false;
      }

      if (activeFilter === "all") {
        return true;
      }

      if (activeFilter === "favorites") {
        return favorites.has(template.id);
      }

      return template.category?.slug === activeFilter;
    });
  }, [activeFilter, favorites, query, templates]);

  function showToast(nextToast: ToastState) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 2600);
  }

  async function copyTemplate(template: TemplateRecord) {
    try {
      await navigator.clipboard.writeText(template.content);
      setCopiedId(template.id);
      trackTemplateCopied(template.category?.slug || template.template_type);
      void fetch("/api/beta-checklist/complete", {
        body: JSON.stringify({ checklistKey: "copy_template" }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
        .then((response) => {
          if (response.ok) {
            trackBetaChecklistItemCompleted({ checklistKey: "copy_template" });
          }
        })
        .catch(() => undefined);
      showToast({ message: "Đã sao chép mẫu.", tone: "success" });
      window.setTimeout(() => setCopiedId(""), 2200);
    } catch {
      showToast({
        message: "Không thể sao chép mẫu lúc này. Vui lòng thử lại.",
        tone: "error",
      });
    }
  }

  async function toggleFavorite(template: TemplateRecord) {
    setUpdatingFavoriteId(template.id);

    try {
      const response = await fetch("/api/templates/favorite", {
        body: JSON.stringify({ templateId: template.id }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as {
        data?: { favorited?: boolean };
        success?: boolean;
      };

      if (!response.ok || !result.success) {
        throw new Error("Favorite failed");
      }

      setFavorites((current) => {
        const next = new Set(current);

        if (result.data?.favorited) {
          next.add(template.id);
          trackTemplateFavorited(getTrackingProps(template));
          showToast({ message: "Đã lưu vào yêu thích.", tone: "success" });
        } else {
          next.delete(template.id);
          trackTemplateUnfavorited(getTrackingProps(template));
          showToast({ message: "Đã bỏ khỏi yêu thích.", tone: "success" });
        }

        return next;
      });
    } catch {
      showToast({
        message: "Không thể cập nhật yêu thích lúc này. Vui lòng thử lại.",
        tone: "error",
      });
    } finally {
      setUpdatingFavoriteId("");
    }
  }

  function handleFilterChange(nextFilter: string) {
    setActiveFilter(nextFilter);
    trackTemplateFiltered({
      categorySlug: nextFilter === "all" || nextFilter === "favorites" ? undefined : nextFilter,
    });
  }

  function openTemplate(template: TemplateRecord) {
    setSelectedTemplate(template);
    setShowAIPersonalizer(false);
    trackTemplateViewed(getTrackingProps(template));
  }

  return (
    <div className="mt-6">
      {!schemaReady ? (
        <div className="mb-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none" />
          Chưa thấy bảng template trong Supabase. Hãy chạy
          supabase/export-template-schema.sql và supabase/seed-templates.sql để bật thư viện mẫu.
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-bold text-ink">
          Tìm mẫu
          <div className="relative mt-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              className="min-h-12 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              onBlur={() => {
                if (query.trim()) {
                  trackTemplateSearched();
                }
              }}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm mẫu theo tiêu đề hoặc nội dung..."
              value={query}
            />
          </div>
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className={[
              "min-h-11 rounded-lg px-4 py-2 text-sm font-bold transition",
              activeFilter === "all"
                ? "bg-ink text-white"
                : "border border-slate-200 bg-white text-ink hover:border-ocean",
            ].join(" ")}
            onClick={() => handleFilterChange("all")}
            type="button"
          >
            Tất cả
          </button>
          {categories.map((category) => (
            <button
              className={[
                "min-h-11 rounded-lg px-4 py-2 text-sm font-bold transition",
                activeFilter === category.slug
                  ? "bg-ink text-white"
                  : "border border-slate-200 bg-white text-ink hover:border-ocean",
              ].join(" ")}
              key={category.id}
              onClick={() => handleFilterChange(category.slug)}
              type="button"
            >
              {category.name}
            </button>
          ))}
          <button
            className={[
              "inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition",
              activeFilter === "favorites"
                ? "bg-ink text-white"
                : "border border-slate-200 bg-white text-ink hover:border-ocean",
            ].join(" ")}
            onClick={() => handleFilterChange("favorites")}
            type="button"
          >
            <Star aria-hidden="true" className="h-4 w-4" />
            Yêu thích
          </button>
        </div>
      </div>

      {filteredTemplates.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {filteredTemplates.map((template) => {
            const isFavorite = favorites.has(template.id);

            return (
              <article
                className="flex min-h-[260px] flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={template.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-ocean">
                      {template.category?.name || "Mẫu sale"}
                    </p>
                    <h2 className="mt-2 text-lg font-bold leading-7 text-ink">
                      {template.title}
                    </h2>
                  </div>
                  <button
                    className={[
                      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition",
                      isFavorite
                        ? "border-rose-200 bg-rose-50 text-rose-600"
                        : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-600",
                    ].join(" ")}
                    disabled={updatingFavoriteId === template.id}
                    onClick={() => toggleFavorite(template)}
                    title={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
                    type="button"
                  >
                    <Heart
                      aria-hidden="true"
                      className={isFavorite ? "h-5 w-5 fill-current" : "h-5 w-5"}
                    />
                  </button>
                </div>

                <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                  {template.description || template.content.slice(0, 180)}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-cloud px-3 py-1.5 text-xs font-bold text-slate-600">
                    {getChannelLabel(template.channel)}
                  </span>
                  <span className="rounded-lg bg-mint/15 px-3 py-1.5 text-xs font-bold text-ocean">
                    {getTemplateTypeLabel(template.template_type)}
                  </span>
                  {template.situation ? (
                    <span className="rounded-lg bg-cloud px-3 py-1.5 text-xs font-bold text-slate-600">
                      {template.situation}
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <button
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-ink transition hover:border-ocean"
                    onClick={() => openTemplate(template)}
                    type="button"
                  >
                    <Eye aria-hidden="true" className="h-5 w-5" />
                    Xem
                  </button>
                  <button
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-ocean"
                    onClick={() => copyTemplate(template)}
                    type="button"
                  >
                    {copiedId === template.id ? (
                      <Check aria-hidden="true" className="h-5 w-5" />
                    ) : (
                      <Copy aria-hidden="true" className="h-5 w-5" />
                    )}
                    {copiedId === template.id ? "Đã sao chép" : "Sao chép"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-bold text-ink">Chưa có mẫu phù hợp.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-base leading-8 text-slate-600">
            Hãy đổi từ khóa, chọn nhóm khác hoặc chạy seed template trong Supabase.
          </p>
        </div>
      )}

      {selectedTemplate ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-ink/45 p-3 sm:items-center sm:p-6">
          <div className="mx-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-soft sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-ocean">
                  {selectedTemplate.category?.name || "Mẫu sale"}
                </p>
                <h2 className="mt-2 text-2xl font-bold leading-tight text-ink">
                  {selectedTemplate.title}
                </h2>
                {selectedTemplate.description ? (
                  <p className="mt-2 text-base leading-7 text-slate-600">
                    {selectedTemplate.description}
                  </p>
                ) : null}
              </div>
              <button
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-ink"
                onClick={() => {
                  setSelectedTemplate(null);
                  setShowAIPersonalizer(false);
                }}
                title="Đóng"
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-cloud p-4">
              <p className="text-sm font-bold text-ink">Gợi ý sử dụng</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Thay các phần trong ngoặc vuông bằng thông tin thật của bạn và
                của khách trước khi gửi.
              </p>
            </div>

            <div className="mt-5 whitespace-pre-line rounded-lg border border-slate-200 bg-white p-4 text-base leading-8 text-slate-700">
              {selectedTemplate.content}
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-base font-bold text-white transition hover:bg-ocean"
                onClick={() => copyTemplate(selectedTemplate)}
                type="button"
              >
                <Copy aria-hidden="true" className="h-5 w-5" />
                Sao chép
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink transition hover:border-ocean"
                onClick={() => toggleFavorite(selectedTemplate)}
                type="button"
              >
                <Heart
                  aria-hidden="true"
                  className={
                    favorites.has(selectedTemplate.id) ? "h-5 w-5 fill-current text-rose-600" : "h-5 w-5"
                  }
                />
                {favorites.has(selectedTemplate.id)
                  ? "Bỏ yêu thích"
                  : "Đánh dấu yêu thích"}
              </button>
            </div>

            <button
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3]"
              onClick={() => setShowAIPersonalizer((current) => !current)}
              type="button"
            >
              <Sparkles aria-hidden="true" className="h-5 w-5" />
              Cá nhân hóa bằng AI
            </button>

            {showAIPersonalizer ? (
              <div className="mt-5">
                <AIAssistantPanel
                  defaultRequestType="personalize_template"
                  templateId={selectedTemplate.id}
                  title="Cá nhân hóa template"
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed inset-x-4 top-4 z-[100] mx-auto max-w-md sm:left-auto sm:right-5 sm:mx-0">
          <div
            className={[
              "rounded-lg border bg-white px-4 py-3 text-sm font-semibold shadow-soft",
              toast.tone === "error" ? "border-rose-200 text-rose-700" : "border-emerald-200 text-ink",
            ].join(" ")}
            role="status"
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
