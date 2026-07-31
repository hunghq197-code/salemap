"use client";

import { CheckCircle2, Circle, Loader2, MessageSquareHeart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

type ActivationChecklistItem = {
  completed: boolean;
  cta: string;
  description: string;
  href: string;
  key: string;
  title: string;
};

type ActivationChecklistProps = {
  completedCount: number;
  hasDemoData: boolean;
  items: ActivationChecklistItem[];
  score: number;
  totalCount: number;
};

const difficultyOptions = [
  { label: "Dễ", value: "easy" },
  { label: "Bình thường", value: "normal" },
  { label: "Khó", value: "hard" },
  { label: "Rối", value: "confusing" },
] as const;

async function parseApiResponse(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    success?: boolean;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message || "Không thể cập nhật lúc này.");
  }
}

export function ActivationChecklist({
  completedCount,
  hasDemoData,
  items,
  score,
  totalCount,
}: ActivationChecklistProps) {
  const router = useRouter();
  const [deletingDemo, setDeletingDemo] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(true);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [difficulty, setDifficulty] =
    useState<(typeof difficultyOptions)[number]["value"]>("normal");
  const [statusMessage, setStatusMessage] = useState("");
  const isComplete = score >= 100;
  const progressPercent = Math.min(100, Math.max(0, score));
  const nextItem = useMemo(() => items.find((item) => !item.completed), [items]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFeedbackSubmitted(
        window.localStorage.getItem("salemap:onboarding-feedback") === "1",
      );
    }, 0);
    trackEvent(ANALYTICS_EVENTS.ACTIVATION_CHECKLIST_VIEWED, {
      activationScore: score,
      hasDemoData,
    });

    return () => window.clearTimeout(timeoutId);
  }, [hasDemoData, score]);

  async function deleteDemoData() {
    setDeletingDemo(true);
    setStatusMessage("");

    try {
      await parseApiResponse(
        await fetch("/api/onboarding/demo-data", {
          method: "DELETE",
        }),
      );
      trackEvent(ANALYTICS_EVENTS.DEMO_DATA_DELETED, { source: "dashboard" });
      setStatusMessage("Đã xóa dữ liệu mẫu khỏi tài khoản của bạn.");
      router.refresh();
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Không thể xóa dữ liệu mẫu. Vui lòng thử lại.",
      );
    } finally {
      setDeletingDemo(false);
    }
  }

  async function submitFeedback() {
    setStatusMessage("");

    try {
      await parseApiResponse(
        await fetch("/api/onboarding/feedback", {
          body: JSON.stringify({
            difficulty,
            message,
            rating,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      );
      window.localStorage.setItem("salemap:onboarding-feedback", "1");
      setFeedbackSubmitted(true);
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_FEEDBACK_SUBMITTED, {
        difficulty,
        rating,
        source: "activation_checklist",
      });
      setStatusMessage("Cảm ơn bạn đã góp ý.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Không thể gửi góp ý lúc này. Vui lòng thử lại.",
      );
    }
  }

  return (
    <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Bắt đầu với SaleMap
          </p>
          <h2 className="mt-2 text-lg font-bold text-text-primary sm:text-xl">
            {isComplete
              ? "Bạn đã hoàn thành thiết lập cơ bản"
              : `Bạn đã hoàn thành ${completedCount}/${totalCount} bước khởi động`}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
            {isComplete
              ? "Bây giờ hãy dùng SaleMap mỗi ngày để theo dõi khách cần chăm sóc."
              : "Hoàn thành các bước này để biến SaleMap thành công cụ tìm khách và chăm sóc khách hằng ngày."}
          </p>
        </div>
        <div className="min-w-[180px]">
          <p className="text-right text-sm font-bold text-text-muted">
            Activation score
          </p>
          <p className="mt-1 text-right text-3xl font-bold text-text-primary">{score}/100</p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {!isComplete ? (
        <div className="mt-5 grid gap-3">
          {items.map((item) => (
            <article
              className={[
                "rounded-card border p-4",
                item.completed
                  ? "border-success/25 bg-success-soft"
                  : "border-border-soft bg-surface-muted",
              ].join(" ")}
              key={item.key}
            >
              <div className="flex items-start gap-2">
                {item.completed ? (
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 flex-none text-success"
                  />
                ) : (
                  <Circle
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 flex-none text-text-muted"
                  />
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-bold leading-6 text-text-primary">{item.title}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-text-muted">
                    {item.description}
                  </p>
                </div>
              </div>
              {!item.completed ? (
                <Link
                  className="mt-3 inline-flex min-h-9 items-center rounded-control border border-border-soft bg-surface px-3 py-2 text-xs font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                  href={item.href}
                >
                  {item.cta}
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {nextItem ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-primary-hover"
            href={nextItem.href}
          >
            {nextItem.cta}
          </Link>
        ) : (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-sidebar px-4 py-2 text-sm font-bold text-white transition hover:bg-primary"
            href="/app/tasks"
          >
            Mở việc cần làm hôm nay
          </Link>
        )}

        {hasDemoData ? (
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-danger/20 bg-danger-soft px-4 py-2 text-sm font-bold text-danger transition hover:border-danger/40"
            disabled={deletingDemo}
            onClick={deleteDemoData}
            type="button"
          >
            {deletingDemo ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            )}
            Xóa dữ liệu mẫu
          </button>
        ) : null}
      </div>

      {isComplete && !feedbackSubmitted ? (
        <div className="mt-5 rounded-card border border-border-soft bg-surface-muted p-4">
          <div className="flex items-start gap-3">
            <MessageSquareHeart
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 flex-none text-primary"
            />
            <div className="flex-1">
              <h3 className="text-base font-bold text-text-primary">
                Bạn thấy bước khởi động này thế nào?
              </h3>
              <div className="mt-3 grid gap-3 md:grid-cols-[120px_1fr]">
                <label className="text-sm font-bold text-text-primary">
                  Điểm
                  <select
                    className="mt-1 min-h-10 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                    onChange={(event) => setRating(Number(event.target.value))}
                    value={rating}
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value}/5
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold text-text-primary">
                  Cảm nhận
                  <select
                    className="mt-1 min-h-10 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                    onChange={(event) =>
                      setDifficulty(
                        event.target.value as (typeof difficultyOptions)[number]["value"],
                      )
                    }
                    value={difficulty}
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <textarea
                className="mt-3 min-h-20 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
                maxLength={500}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Góp ý ngắn nếu có"
                value={message}
              />
              <button
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-control bg-sidebar px-4 py-2 text-sm font-bold text-white transition hover:bg-primary"
                onClick={submitFeedback}
                type="button"
              >
                Gửi góp ý
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {statusMessage ? (
        <p className="mt-4 rounded-control border border-border-soft bg-surface-muted px-4 py-3 text-sm font-semibold text-text-secondary">
          {statusMessage}
        </p>
      ) : null}
    </section>
  );
}
