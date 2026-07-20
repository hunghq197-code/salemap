"use client";

import { MessageSquareHeart, Send, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { trackEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import {
  SURVEY_CONTINUE_OPTIONS,
  SURVEY_PAY_OPTIONS,
  SURVEY_USEFUL_FEATURE_OPTIONS,
} from "@/lib/constants/surveys";

type BetaSurveyModalProps = {
  coreActionsCompleted: number;
  eligible: boolean;
  hasCoreLoop: boolean;
  hasSubmitted: boolean;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function getNpsGroup(value: number) {
  if (value >= 9) return "promoter";
  if (value >= 7) return "passive";
  return "detractor";
}

export function BetaSurveyModal({
  coreActionsCompleted,
  eligible,
  hasCoreLoop,
  hasSubmitted,
}: BetaSurveyModalProps) {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openSurvey() {
    setOpen(true);
    trackEvent(ANALYTICS_EVENTS.BETA_SURVEY_SHOWN);
  }

  function closeSurvey() {
    setOpen(false);
    trackEvent(ANALYTICS_EVENTS.BETA_SURVEY_DISMISSED);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const rating = Number(formData.get("rating"));
    const npsScore = Number(formData.get("npsScore"));
    const payload = {
      mostConfusingPart: String(formData.get("mostConfusingPart") || ""),
      mostUsefulFeature: String(formData.get("mostUsefulFeature") || ""),
      npsScore,
      openFeedback: String(formData.get("openFeedback") || ""),
      rating,
      willingnessToPay: String(formData.get("willingnessToPay") || ""),
      wouldContinueUsing: String(formData.get("wouldContinueUsing") || ""),
    };

    try {
      const response = await fetch("/api/surveys/beta-round-2", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: { message?: string } }
        | null;

      if (!response.ok || !result?.success) {
        setError(result?.error?.message || "Không thể gửi khảo sát lúc này.");
        return;
      }

      trackEvent(ANALYTICS_EVENTS.BETA_SURVEY_SUBMITTED, {
        mostUsefulFeature: payload.mostUsefulFeature,
        npsGroup: getNpsGroup(npsScore),
        rating,
        willingnessToPay: payload.willingnessToPay,
        wouldContinueUsing: payload.wouldContinueUsing,
      });
      setSuccess(true);
      setOpen(false);
    } catch {
      setError("Không thể gửi khảo sát lúc này.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="mt-6 rounded-lg border border-ocean/20 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
              <MessageSquareHeart aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">Tiến độ trải nghiệm</h2>
              <p className="mt-2 text-base leading-7 text-slate-600">
                Bạn đã hoàn thành {coreActionsCompleted}/3 bước cốt lõi: tạo lead,
                thêm ghi chú và tạo follow-up.
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                {hasCoreLoop
                  ? "Bạn đã hoàn thành luồng cốt lõi. Hãy thử tìm khách theo khu vực hoặc dọc tuyến."
                  : "Hoàn thành 3 bước này để trải nghiệm đúng giá trị cốt lõi của SaleMap."}
              </p>
              {success || hasSubmitted ? (
                <p className="mt-2 text-sm font-bold text-emerald-700">
                  Cảm ơn bạn đã góp ý cho SaleMap.
                </p>
              ) : null}
            </div>
          </div>
          {eligible && !success ? (
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-base font-bold text-white transition hover:bg-ocean"
              onClick={openSurvey}
              type="button"
            >
              <MessageSquareHeart aria-hidden="true" className="h-5 w-5" />
              Góp ý nhanh 1 phút
            </button>
          ) : null}
        </div>
      </section>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-ink/45 px-4 py-6">
          <div className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-ink">
                  Bạn thấy SaleMap hữu ích đến đâu?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Khảo sát ngắn này giúp tụi mình ưu tiên đúng phần cần cải thiện.
                </p>
              </div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-ink"
                onClick={closeSurvey}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
                <span className="sr-only">Đóng</span>
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-ink">
                  Mức độ hữu ích
                  <input className={inputClass} max="5" min="1" name="rating" required type="number" />
                </label>
                <label className="block text-sm font-bold text-ink">
                  Điểm giới thiệu
                  <input className={inputClass} max="10" min="0" name="npsScore" required type="number" />
                </label>
              </div>
              <label className="block text-sm font-bold text-ink">
                Tính năng hữu ích nhất
                <select className={inputClass} name="mostUsefulFeature" required>
                  {SURVEY_USEFUL_FEATURE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold text-ink">
                Phần khó hiểu nhất
                <textarea className={inputClass} maxLength={1000} name="mostConfusingPart" rows={3} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-ink">
                  Bạn có muốn tiếp tục dùng?
                  <select className={inputClass} name="wouldContinueUsing" required>
                    {SURVEY_CONTINUE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-bold text-ink">
                  Bạn có sẵn sàng trả phí?
                  <select className={inputClass} name="willingnessToPay" required>
                    {SURVEY_PAY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm font-bold text-ink">
                Góp ý thêm
                <textarea className={inputClass} maxLength={1500} name="openFeedback" rows={4} />
              </label>
              {error ? <p className="text-sm font-bold text-rose-700">{error}</p> : null}
              <button
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3]"
                disabled={isSubmitting}
                type="submit"
              >
                <Send aria-hidden="true" className="h-5 w-5" />
                {isSubmitting ? "Đang gửi..." : "Gửi khảo sát"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
