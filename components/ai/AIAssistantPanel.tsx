"use client";

import {
  Bot,
  ClipboardCopy,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  trackAIAssistantViewed,
  trackAIGenerateClicked,
  trackAIGenerateCompleted,
  trackAIGenerateFailed,
  trackAIOutputCopied,
  trackAIOutputSaved,
  trackAIOutputSavedToNote,
  trackAIQuotaReached,
  trackAITemplatePersonalized,
} from "@/lib/analytics/client";
import type { aiRequestTypes } from "@/lib/validators/ai";

type AIRequestType = (typeof aiRequestTypes)[number];

type AIAssistantPanelProps = {
  defaultRequestType?: AIRequestType;
  leadId?: string;
  templateId?: string;
  title?: string;
};

type AIResponse = {
  data?: {
    aiRequestId?: string;
    outputType?: string;
    quota?: {
      limit: number;
      remaining: number;
      used: number;
    };
    requestType?: string;
    text?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
  success?: boolean;
};

type AIQuota = NonNullable<NonNullable<AIResponse["data"]>["quota"]>;

const requestTypeOptions: Array<{ label: string; value: AIRequestType }> = [
  { label: "Tin nhắn Zalo", value: "write_zalo_message" },
  { label: "Email giới thiệu", value: "write_email" },
  { label: "Follow-up", value: "write_follow_up" },
  { label: "Xử lý từ chối", value: "handle_objection" },
  { label: "Tóm tắt ghi chú", value: "summarize_notes" },
  { label: "Gợi ý bước tiếp theo", value: "suggest_next_step" },
  { label: "Cá nhân hóa template", value: "personalize_template" },
];

const toneOptions = [
  { label: "Thân thiện", value: "friendly" },
  { label: "Chuyên nghiệp", value: "professional" },
  { label: "Ngắn gọn", value: "short" },
  { label: "Ấm áp", value: "warm" },
  { label: "Trực tiếp", value: "direct" },
  { label: "Thuyết phục", value: "persuasive" },
] as const;

const channelOptions = [
  { label: "Zalo", value: "zalo" },
  { label: "Email", value: "email" },
  { label: "Điện thoại", value: "phone" },
  { label: "Trực tiếp", value: "direct" },
  { label: "Khác", value: "other" },
] as const;

const objectionOptions = [
  { label: "Giá cao", value: "price_high" },
  { label: "Cần thêm thời gian", value: "need_more_time" },
  { label: "Đang dùng bên khác", value: "using_competitor" },
  { label: "Chưa có nhu cầu", value: "no_need" },
  { label: "Hẹn gọi lại", value: "call_later" },
  { label: "Gửi thông tin trước", value: "send_info_first" },
  { label: "Không phải người quyết định", value: "not_decision_maker" },
  { label: "Khác", value: "other" },
] as const;

function getDefaultChannel(requestType: AIRequestType) {
  if (requestType === "write_email") return "email";
  if (requestType === "write_zalo_message") return "zalo";
  if (requestType === "handle_objection") return "phone";
  return "zalo";
}

export function AIAssistantPanel({
  defaultRequestType = "write_zalo_message",
  leadId,
  templateId,
  title = "Trợ lý AI",
}: AIAssistantPanelProps) {
  const [aiRequestId, setAiRequestId] = useState("");
  const [channel, setChannel] = useState(getDefaultChannel(defaultRequestType));
  const [copied, setCopied] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState<"note" | "output" | null>(null);
  const [objectionType, setObjectionType] = useState("price_high");
  const [outputText, setOutputText] = useState("");
  const [outputType, setOutputType] = useState("other");
  const [quota, setQuota] = useState<AIQuota | null>(null);
  const [requestType, setRequestType] = useState<AIRequestType>(defaultRequestType);
  const [successMessage, setSuccessMessage] = useState("");
  const [tone, setTone] = useState("friendly");

  const trackingPayload = useMemo(
    () => ({
      channel,
      hasLeadId: Boolean(leadId),
      hasTemplateId: Boolean(templateId),
      remainingQuota: quota?.remaining,
      requestType,
      tone,
    }),
    [channel, leadId, quota?.remaining, requestType, templateId, tone],
  );

  useEffect(() => {
    trackAIAssistantViewed({
      channel: getDefaultChannel(defaultRequestType),
      hasLeadId: Boolean(leadId),
      hasTemplateId: Boolean(templateId),
      requestType: defaultRequestType,
      tone: "friendly",
    });
  }, [defaultRequestType, leadId, templateId]);

  async function generate(nextRequestType = requestType, nextInstruction = customInstruction) {
    if (isGenerating) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsGenerating(true);
    setRequestType(nextRequestType);
    trackAIGenerateClicked({
      ...trackingPayload,
      requestType: nextRequestType,
      status: "started",
    });

    try {
      const response = await fetch("/api/ai/generate", {
        body: JSON.stringify({
          channel,
          customInstruction: nextInstruction,
          leadId,
          objectionType,
          requestType: nextRequestType,
          templateId,
          tone,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as AIResponse;

      if (!response.ok || !result.success || !result.data?.text || !result.data.aiRequestId) {
        if (result.error?.code === "AI_QUOTA_EXCEEDED") {
          trackAIQuotaReached({
            ...trackingPayload,
            requestType: nextRequestType,
            status: "quota_reached",
          });
        }

        throw new Error(result.error?.message || "Không thể tạo nội dung AI lúc này.");
      }

      setAiRequestId(result.data.aiRequestId);
      setOutputText(result.data.text);
      setOutputType(result.data.outputType || "other");
      setQuota(result.data.quota ?? null);
      trackAIGenerateCompleted({
        ...trackingPayload,
        remainingQuota: result.data.quota?.remaining,
        requestType: nextRequestType,
        status: "completed",
      });

      if (nextRequestType === "personalize_template") {
        trackAITemplatePersonalized({
          ...trackingPayload,
          remainingQuota: result.data.quota?.remaining,
          requestType: nextRequestType,
          status: "completed",
        });
      }
    } catch (generateError) {
      trackAIGenerateFailed({
        ...trackingPayload,
        requestType: nextRequestType,
        status: "failed",
      });
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Không thể tạo nội dung AI lúc này.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyOutput() {
    if (!outputText) return;

    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setSuccessMessage("Đã sao chép nội dung.");
      trackAIOutputCopied({
        ...trackingPayload,
        requestType,
        status: "copied",
      });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Không thể sao chép lúc này.");
    }
  }

  async function saveOutput() {
    if (!outputText || !aiRequestId) return;

    setIsSaving("output");
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/ai/save-output", {
        body: JSON.stringify({
          aiRequestId,
          content: outputText,
          leadId,
          outputType,
          title: "Nội dung AI đã lưu",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as AIResponse | null;
        throw new Error(result?.error?.message || "Không thể lưu nội dung AI.");
      }

      setSuccessMessage("Đã lưu kết quả AI.");
      trackAIOutputSaved({
        ...trackingPayload,
        requestType,
        status: "saved",
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không thể lưu nội dung AI.");
    } finally {
      setIsSaving(null);
    }
  }

  async function saveToNote() {
    if (!outputText || !aiRequestId || !leadId) return;

    setIsSaving("note");
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/ai/save-to-note", {
        body: JSON.stringify({
          aiRequestId,
          content: outputText,
          leadId,
          outputType,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as AIResponse | null;
        throw new Error(result?.error?.message || "Không thể lưu vào ghi chú lead.");
      }

      setSuccessMessage("Đã lưu vào ghi chú lead. Tải lại trang để xem trong timeline.");
      trackAIOutputSavedToNote({
        ...trackingPayload,
        requestType,
        status: "saved_to_note",
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không thể lưu vào ghi chú.");
    } finally {
      setIsSaving(null);
    }
  }

  function generateVariant(nextRequestType: AIRequestType) {
    const labelMap: Record<string, string> = {
      make_message_more_professional: "Viết chuyên nghiệp hơn",
      make_message_warmer: "Viết thân thiện hơn",
      shorten_message: "Rút gọn nội dung",
    };
    const nextInstruction = outputText
      ? `${labelMap[nextRequestType] || "Viết lại"} nội dung sau:\n\n${outputText}`
      : customInstruction;

    void generate(nextRequestType, nextInstruction);
  }

  return (
    <section className="rounded-lg border border-ocean/20 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
          <Bot aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tạo nhanh tin nhắn, email, follow-up và cách xử lý tình huống. Bạn luôn là người kiểm tra trước khi gửi.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-bold text-ink">
          Nội dung cần tạo
          <select
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            onChange={(event) => {
              const nextType = event.target.value as AIRequestType;
              setRequestType(nextType);
              setChannel(getDefaultChannel(nextType));
            }}
            value={requestType}
          >
            {requestTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-bold text-ink">
          Kênh sử dụng
          <select
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            onChange={(event) => setChannel(event.target.value)}
            value={channel}
          >
            {channelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-bold text-ink">
          Giọng văn
          <select
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            onChange={(event) => setTone(event.target.value)}
            value={tone}
          >
            {toneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {requestType === "handle_objection" ? (
        <label className="mt-4 block text-sm font-bold text-ink">
          Tình huống từ chối
          <select
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            onChange={(event) => setObjectionType(event.target.value)}
            value={objectionType}
          >
            {objectionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="mt-4 block text-sm font-bold text-ink">
        Yêu cầu thêm
        <textarea
          className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-base leading-7 text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          maxLength={1200}
          onChange={(event) => setCustomInstruction(event.target.value)}
          placeholder="Ví dụ: khách vừa hỏi báo giá, hãy viết nhẹ nhàng và đề xuất hẹn demo 15 phút."
          value={customInstruction}
        />
      </label>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <button
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-base font-bold text-white transition hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        disabled={isGenerating}
        onClick={() => generate()}
        type="button"
      >
        {isGenerating ? (
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
        ) : (
          <Sparkles aria-hidden="true" className="h-5 w-5" />
        )}
        {isGenerating ? "AI đang tạo nội dung..." : "Tạo nội dung"}
      </button>

      {quota ? (
        <p className="mt-3 text-sm font-semibold text-slate-500">
          AI hôm nay: {quota.used}/{quota.limit} lượt, còn {quota.remaining} lượt.
        </p>
      ) : null}

      {outputText ? (
        <article className="mt-6 rounded-lg border border-slate-200 bg-cloud/40 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink">Nội dung AI tạo</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Nội dung do AI hỗ trợ tạo. Hãy kiểm tra lại thông tin trước khi gửi cho khách.
              </p>
            </div>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
              onClick={() => generate()}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Tạo lại
            </button>
          </div>

          <div className="mt-4 whitespace-pre-line rounded-lg border border-slate-200 bg-white p-4 text-base leading-8 text-slate-700">
            {outputText}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ocean"
              onClick={copyOutput}
              type="button"
            >
              <ClipboardCopy aria-hidden="true" className="h-4 w-4" />
              {copied ? "Đã sao chép" : "Sao chép"}
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean disabled:opacity-70"
              disabled={isSaving === "output"}
              onClick={saveOutput}
              type="button"
            >
              {isSaving === "output" ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="h-4 w-4" />
              )}
              Lưu kết quả AI
            </button>
            {leadId ? (
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean disabled:opacity-70"
                disabled={isSaving === "note"}
                onClick={saveToNote}
                type="button"
              >
                {isSaving === "note" ? (
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText aria-hidden="true" className="h-4 w-4" />
                )}
                Lưu vào ghi chú
              </button>
            ) : null}
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
              onClick={() => generateVariant("shorten_message")}
              type="button"
            >
              Rút gọn
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
              onClick={() => generateVariant("make_message_more_professional")}
              type="button"
            >
              Chuyên nghiệp hơn
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
              onClick={() => generateVariant("make_message_warmer")}
              type="button"
            >
              Thân thiện hơn
            </button>
            {leadId ? (
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
                onClick={() => generate("write_follow_up")}
                type="button"
              >
                Tạo follow-up
              </button>
            ) : null}
          </div>
        </article>
      ) : null}
    </section>
  );
}
