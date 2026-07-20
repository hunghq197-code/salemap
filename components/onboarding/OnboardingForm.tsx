"use client";

import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  desiredFeatureOptions,
  industryOptions,
  roleOptions,
} from "@/lib/constants";
import { trackOnboardingCompleted } from "@/lib/analytics/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const defaultTags = [
  { color: "#ef4444", name: "Khách nóng" },
  { color: "#f59e0b", name: "Hẹn lại" },
  { color: "#0ea5e9", name: "Đã báo giá" },
  { color: "#22c55e", name: "Tiềm năng cao" },
  { color: "#64748b", name: "Chưa có nhu cầu" },
  { color: "#8b5cf6", name: "Đang dùng đối thủ" },
] as const;

const steps = [
  "Vai trò sale",
  "Ngành đang bán",
  "Khu vực hoạt động",
  "Mục tiêu sử dụng",
] as const;

type OnboardingState = {
  goals: string[];
  industry: string;
  primaryCity: string;
  primaryDistrict: string;
  roleType: string;
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

export function OnboardingForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<OnboardingState>({
    goals: [],
    industry: "",
    primaryCity: "",
    primaryDistrict: "",
    roleType: "",
  });

  const isLastStep = currentStep === steps.length - 1;

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

  function toggleGoal(goal: string) {
    setError("");
    setFormState((current) => ({
      ...current,
      goals: current.goals.includes(goal)
        ? current.goals.filter((item) => item !== goal)
        : [...current.goals, goal],
    }));
  }

  function validateStep(step: number) {
    if (step === 0 && !formState.roleType) {
      return "Vui lòng chọn vai trò hiện tại.";
    }

    if (step === 1 && !formState.industry) {
      return "Vui lòng chọn ngành đang bán.";
    }

    if (step === 2 && (!formState.primaryCity || !formState.primaryDistrict)) {
      return "Vui lòng nhập tỉnh/thành và quận/huyện chính.";
    }

    if (step === 3 && formState.goals.length === 0) {
      return "Vui lòng chọn ít nhất một mục tiêu sử dụng.";
    }

    return "";
  }

  async function handleNext() {
    const validationError = validateStep(currentStep);

    if (validationError) {
      setError(validationError);
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  async function handleSubmit() {
    const validationError = validateStep(currentStep);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error: profileError } = await supabase.from("user_profiles").upsert(
        {
          goals: formState.goals,
          industry: formState.industry,
          onboarding_completed: true,
          primary_city: formState.primaryCity,
          primary_district: formState.primaryDistrict,
          role_type: formState.roleType,
          user_id: user.id,
        },
        {
          onConflict: "user_id",
        },
      );

      if (profileError) {
        setError("Không thể lưu onboarding. Vui lòng kiểm tra schema Supabase.");
        return;
      }

      await supabase.from("tags").upsert(
        defaultTags.map((tag) => ({
          ...tag,
          user_id: user.id,
        })),
        {
          ignoreDuplicates: true,
          onConflict: "user_id,name",
        },
      );

      trackOnboardingCompleted({
        goalsCount: formState.goals.length,
        industry: formState.industry,
        roleType: formState.roleType,
      });

      router.replace("/app/dashboard");
      router.refresh();
    } catch {
      setError("Không thể hoàn tất onboarding lúc này. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
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
            <h2 className="text-2xl font-bold text-ink">Vai trò của bạn là gì?</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {roleOptions.map((role) => (
                <button
                  className={optionClasses(formState.roleType === role)}
                  key={role}
                  onClick={() => setField("roleType", role)}
                  type="button"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div>
            <h2 className="text-2xl font-bold text-ink">Bạn đang bán ngành nào?</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {industryOptions.map((industry) => (
                <button
                  className={optionClasses(formState.industry === industry)}
                  key={industry}
                  onClick={() => setField("industry", industry)}
                  type="button"
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div>
            <h2 className="text-2xl font-bold text-ink">
              Khu vực hoạt động chính của bạn
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-bold text-ink">
                Tỉnh/thành
                <input
                  className={inputClasses()}
                  disabled={isSubmitting}
                  onChange={(event) => setField("primaryCity", event.target.value)}
                  placeholder="VD: TP. Hồ Chí Minh"
                  type="text"
                  value={formState.primaryCity}
                />
              </label>
              <label className="text-sm font-bold text-ink">
                Quận/huyện chính
                <input
                  className={inputClasses()}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setField("primaryDistrict", event.target.value)
                  }
                  placeholder="VD: Quận 7"
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
              Bạn muốn SaleMap giúp gì trước?
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {desiredFeatureOptions.map((goal) => {
                const isSelected = formState.goals.includes(goal);

                return (
                  <button
                    className={optionClasses(isSelected)}
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckCircle2
                          aria-hidden="true"
                          className="h-5 w-5 flex-none text-mint"
                        />
                      ) : null}
                      {goal}
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

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
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
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-sm font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          onClick={isLastStep ? handleSubmit : handleNext}
          type="button"
        >
          {isLastStep
            ? isSubmitting
              ? "Đang hoàn tất..."
              : "Hoàn tất onboarding"
            : "Tiếp tục"}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
