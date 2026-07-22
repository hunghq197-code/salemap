"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Database, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import {
  ONBOARDING_INDUSTRY_OPTIONS,
  ONBOARDING_PRIMARY_GOAL_OPTIONS,
  ONBOARDING_ROLE_OPTIONS,
  SALES_MODEL_BY_ROLE,
  type OnboardingIndustry,
  type OnboardingPrimaryGoal,
  type OnboardingRole,
} from "@/lib/constants/onboarding";

const steps = [
  "Hình thức bán hàng",
  "Ngành đang bán",
  "Khu vực hoạt động",
  "Mục tiêu sử dụng",
] as const;

type SubmitAction = "demo" | "skip" | "start" | null;

type OnboardingState = {
  industry: OnboardingIndustry | "";
  primaryCity: string;
  primaryDistrict: string;
  primaryGoal: OnboardingPrimaryGoal | "";
  role: OnboardingRole | "";
};

type ApiResponse = {
  error?: { message?: string };
  success?: boolean;
};

function optionClasses(isSelected: boolean) {
  return [
    "min-h-12 rounded-lg border px-4 py-3 text-left text-sm font-semibold leading-6 transition",
    isSelected
      ? "border-ocean bg-mint/10 text-ink shadow-sm"
      : "border-slate-200 bg-white text-slate-700 hover:border-ocean hover:text-ink",
  ].join(" ");
}

function inputClasses() {
  return "mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-slate-400 focus:border-ocean focus:ring-2 focus:ring-ocean/25 disabled:cursor-not-allowed disabled:bg-slate-50";
}

async function parseApiResponse(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as ApiResponse;

  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message || "Không thể lưu thiết lập lúc này.");
  }
}

export function OnboardingForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [submitAction, setSubmitAction] = useState<SubmitAction>(null);
  const [formState, setFormState] = useState<OnboardingState>({
    industry: "",
    primaryCity: "",
    primaryDistrict: "",
    primaryGoal: "",
    role: "",
  });
  const isSubmitting = submitAction !== null;
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_STARTED, {
      source: "onboarding_page",
    });
  }, []);

  function setField<K extends keyof OnboardingState>(
    key: K,
    value: OnboardingState[K],
  ) {
    setError("");
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validateStep(step: number) {
    if (step === 0 && !formState.role) {
      return "Vui lòng chọn hình thức bán hàng.";
    }

    if (step === 1 && !formState.industry) {
      return "Vui lòng chọn ngành đang bán.";
    }

    if (step === 2 && (!formState.primaryCity || !formState.primaryDistrict)) {
      return "Vui lòng nhập tỉnh/thành và quận/huyện hoặc khu vực chính.";
    }

    if (step === 3 && !formState.primaryGoal) {
      return "Vui lòng chọn mục tiêu chính khi dùng SaleMap.";
    }

    return "";
  }

  function buildPayload() {
    if (!formState.role || !formState.industry || !formState.primaryGoal) {
      throw new Error("Dữ liệu thiết lập ban đầu chưa đầy đủ.");
    }

    const primaryCity = formState.primaryCity.trim();
    const primaryDistrict = formState.primaryDistrict.trim();

    return {
      industry: formState.industry,
      mainRegion: [primaryCity, primaryDistrict].filter(Boolean).join(", "),
      primaryCity,
      primaryDistrict,
      primaryGoal: formState.primaryGoal,
      role: formState.role,
      salesModel: SALES_MODEL_BY_ROLE[formState.role],
    };
  }

  function handleNext() {
    const validationError = validateStep(currentStep);

    if (validationError) {
      setError(validationError);
      return;
    }

    trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, {
      step: steps[currentStep],
    });
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  async function saveProfile() {
    await parseApiResponse(
      await fetch("/api/onboarding/profile", {
        body: JSON.stringify(buildPayload()),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );
  }

  async function complete(useDemoData: boolean) {
    const validationError = validateStep(currentStep);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitAction(useDemoData ? "demo" : "start");
    setError("");

    try {
      await saveProfile();

      if (useDemoData) {
        await parseApiResponse(
          await fetch("/api/onboarding/demo-data", {
            method: "POST",
          }),
        );
        trackEvent(ANALYTICS_EVENTS.DEMO_DATA_CREATED, {
          source: "onboarding",
        });
      }

      await parseApiResponse(
        await fetch("/api/onboarding/complete", {
          method: "POST",
        }),
      );
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
        industry: formState.industry,
        primaryGoal: formState.primaryGoal,
        role: formState.role,
        salesModel: formState.role ? SALES_MODEL_BY_ROLE[formState.role] : "mixed",
        source: useDemoData ? "demo_data" : "discover",
      });

      router.replace(useDemoData ? "/app/dashboard?demo=1" : "/app/discover?from=onboarding");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể hoàn tất onboarding lúc này. Vui lòng thử lại sau.",
      );
    } finally {
      setSubmitAction(null);
    }
  }

  async function skip() {
    setSubmitAction("skip");
    setError("");

    try {
      await parseApiResponse(
        await fetch("/api/onboarding/skip", {
          method: "POST",
        }),
      );
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_SKIPPED, {
        source: "onboarding_page",
      });
      router.replace("/app/dashboard?onboarding=skipped");
      router.refresh();
    } catch (skipError) {
      setError(
        skipError instanceof Error
          ? skipError.message
          : "Không thể bỏ qua onboarding lúc này.",
      );
    } finally {
      setSubmitAction(null);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ocean">
          Bước {currentStep + 1}/{steps.length}
        </p>
        <p className="text-sm font-semibold text-slate-500">{steps[currentStep]}</p>
      </div>

      <div className="mt-4 h-2 rounded-full bg-cloud">
        <div
          className="h-2 rounded-full bg-mint transition-all"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="mt-8">
        {currentStep === 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-ink">
              Bạn đang bán hàng theo hình thức nào?
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {ONBOARDING_ROLE_OPTIONS.map((role) => (
                <button
                  className={optionClasses(formState.role === role.value)}
                  disabled={isSubmitting}
                  key={role.value}
                  onClick={() => setField("role", role.value)}
                  type="button"
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div>
            <h2 className="text-2xl font-bold text-ink">Ngành hàng của bạn là gì?</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {ONBOARDING_INDUSTRY_OPTIONS.map((industry) => (
                <button
                  className={optionClasses(formState.industry === industry.value)}
                  disabled={isSubmitting}
                  key={industry.value}
                  onClick={() => setField("industry", industry.value)}
                  type="button"
                >
                  {industry.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div>
            <h2 className="text-2xl font-bold text-ink">
              Khu vực bạn thường đi sale?
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-bold text-ink">
                Tỉnh/thành
                <input
                  className={inputClasses()}
                  disabled={isSubmitting}
                  onChange={(event) => setField("primaryCity", event.target.value)}
                  placeholder="Ví dụ: TP.HCM, Bình Dương, Ninh Thuận..."
                  type="text"
                  value={formState.primaryCity}
                />
              </label>
              <label className="text-sm font-bold text-ink">
                Quận/huyện hoặc khu vực chính
                <input
                  className={inputClasses()}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setField("primaryDistrict", event.target.value)
                  }
                  placeholder="Ví dụ: Quận 7, Dĩ An, Phan Rang..."
                  type="text"
                  value={formState.primaryDistrict}
                />
              </label>
            </div>
          </div>
        ) : null}

        {currentStep === 3 ? (
          <div>
            <h2 className="text-2xl font-bold text-ink">
              Mục tiêu chính của bạn khi dùng SaleMap?
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {ONBOARDING_PRIMARY_GOAL_OPTIONS.map((goal) => {
                const isSelected = formState.primaryGoal === goal.value;

                return (
                  <button
                    className={optionClasses(isSelected)}
                    disabled={isSubmitting}
                    key={goal.value}
                    onClick={() => setField("primaryGoal", goal.value)}
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckCircle2
                          aria-hidden="true"
                          className="h-5 w-5 flex-none text-mint"
                        />
                      ) : null}
                      {goal.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-ink transition hover:border-ocean hover:text-ocean disabled:cursor-not-allowed disabled:opacity-50"
            disabled={currentStep === 0 || isSubmitting}
            onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Quay lại
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-ocean hover:text-ocean disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            onClick={skip}
            type="button"
          >
            {submitAction === "skip" ? "Đang bỏ qua..." : "Bỏ qua"}
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {isLastStep ? (
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-ocean/30 bg-white px-5 py-3 text-sm font-bold text-ink shadow-sm transition hover:border-ocean disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              onClick={() => complete(true)}
              type="button"
            >
              {submitAction === "demo" ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Database aria-hidden="true" className="h-4 w-4" />
              )}
              Dùng dữ liệu mẫu để trải nghiệm
            </button>
          ) : null}

          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-sm font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            onClick={isLastStep ? () => complete(false) : handleNext}
            type="button"
          >
            {isLastStep ? (
              submitAction === "start" ? (
                "Đang hoàn tất..."
              ) : (
                "Bắt đầu tìm khách đầu tiên"
              )
            ) : (
              "Tiếp tục"
            )}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
