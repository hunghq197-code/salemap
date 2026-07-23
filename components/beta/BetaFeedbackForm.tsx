"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageSquareHeart, Send } from "lucide-react";
import {
  trackBetaChecklistItemCompleted,
  trackBetaFeedbackFailed,
  trackBetaFeedbackOpened,
  trackBetaFeedbackSubmitted,
} from "@/lib/analytics/client";
import { FEEDBACK_TYPE_OPTIONS } from "@/lib/constants/beta-feedback";

function getDeviceType() {
  if (typeof window === "undefined") {
    return "unknown";
  }

  return window.innerWidth < 768 ? "mobile" : "desktop";
}

export function BetaFeedbackForm() {
  const [content, setContent] = useState("");
  const [feedbackType, setFeedbackType] = useState("general_feedback");
  const [rating, setRating] = useState("");
  const [status, setStatus] = useState<"error" | "idle" | "success">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const pagePath = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const from = new URLSearchParams(window.location.search).get("from");
    return from || window.location.pathname;
  }, []);

  useEffect(() => {
    trackBetaFeedbackOpened();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    setSubmitting(true);

    try {
      const response = await fetch("/api/beta-feedback", {
        body: JSON.stringify({
          browserInfo:
            typeof window === "undefined" ? "" : window.navigator.userAgent.slice(0, 500),
          content,
          deviceType: getDeviceType(),
          feedbackType,
          pagePath,
          rating: rating ? Number(rating) : undefined,
          title,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as { success?: boolean };

      if (!response.ok || !result.success) {
        throw new Error("Feedback failed");
      }

      setStatus("success");
      setContent("");
      setRating("");
      setTitle("");
      trackBetaFeedbackSubmitted({
        feedbackType,
        rating: rating ? Number(rating) : null,
      });
      trackBetaChecklistItemCompleted({ checklistKey: "send_feedback" });
    } catch {
      setStatus("error");
      trackBetaFeedbackFailed(feedbackType);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start gap-3 rounded-lg bg-cloud px-4 py-3">
        <MessageSquareHeart aria-hidden="true" className="mt-1 h-5 w-5 text-ocean" />
        <p className="text-sm font-semibold leading-6 text-slate-600">
          Form này mất khoảng 1 phút. Nội dung góp ý chỉ lưu vào Supabase để nhóm SaleMap cải thiện sản phẩm, không gửi lên analytics.
        </p>
      </div>

      <label className="mt-5 block text-sm font-bold text-ink">
        Loại góp ý *
        <select
          className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          onChange={(event) => setFeedbackType(event.target.value)}
          required
          value={feedbackType}
        >
          {FEEDBACK_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-bold text-ink">
        Mức độ hài lòng 1-5
        <select
          className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          onChange={(event) => setRating(event.target.value)}
          value={rating}
        >
          <option value="">Chưa chọn</option>
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-bold text-ink">
        Tiêu đề ngắn
        <input
          className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          maxLength={160}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="VD: Tìm khách dọc tuyến hơi khó hiểu"
          value={title}
        />
      </label>

      <label className="mt-4 block text-sm font-bold text-ink">
        Nội dung góp ý *
        <textarea
          className="mt-2 min-h-40 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-base leading-7 text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          maxLength={3000}
          minLength={5}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Mô tả càng cụ thể càng tốt: bạn đang ở màn hình nào, thao tác gì, kết quả mong muốn là gì..."
          required
          value={content}
        />
      </label>

      {status === "success" ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
          Cảm ơn bạn đã góp ý. Chúng tôi sẽ xem xét để cải thiện sản phẩm.
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
          Không thể gửi góp ý lúc này. Vui lòng thử lại sau.
        </div>
      ) : null}

      <button
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={submitting}
        type="submit"
      >
        <Send aria-hidden="true" className="h-5 w-5" />
        {submitting ? "Đang gửi..." : "Gửi góp ý"}
      </button>
    </form>
  );
}
