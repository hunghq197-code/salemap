"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import {
  trackBetaFormFailed,
  trackBetaFormStarted,
  trackBetaFormSubmitClicked,
  trackBetaFormSubmitted,
} from "@/lib/analytics/client";

type BetaSignupData = {
  betaReadiness: string;
  currentRole: string;
  desiredFeatures: string[];
  email: string;
  fullName: string;
  industry: string;
  mainArea: string;
  phoneZalo: string;
};

type FieldErrors = Partial<Record<keyof BetaSignupData, string>>;

type ApiError = {
  code: string;
  details?: Array<{
    field?: string;
    message?: string;
  }>;
  message: string;
};

type ApiResponse =
  | {
      data: {
        betaScore: number;
        id: string;
        personaLabel: string;
      };
      success: true;
    }
  | {
      error: ApiError;
      success: false;
    };

const betaFormCopy = {
  en: {
    betaReadinessLabel: "Are you ready to try SaleMap and share feedback?",
    betaReadinessPlaceholder: "Choose readiness level",
    bullets: [
      "Priority for people with real daily sales work",
      "Quick contact via Zalo or email when your account is ready",
      "Free to start during the launch phase",
    ],
    currentRoleLabel: "Current role",
    currentRolePlaceholder: "Choose role",
    desiredFeaturesLabel: "Features you want most",
    emailLabel: "Email",
    featureRequired: "Please choose at least one feature.",
    formTime: "Form time: about 1 minute.",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "Nguyen Van A",
    industryLabel: "Industry",
    industryPlaceholder: "Choose industry",
    intro:
      "Leave your details. We will help you get started with SaleMap.",
    mainAreaLabel: "Main sales area",
    mainAreaPlaceholder: "E.g. District 7, Nha Be, Binh Chanh",
    phoneLabel: "Phone/Zalo",
    phonePlaceholder: "09xx xxx xxx",
    privacy:
      "Your information is only used to contact you about SaleMap access and will not be shared with third parties.",
    requiredMessage: "Please fill in this field.",
    selectMessage: "Please choose an option.",
    submit: "Submit request",
    submitting: "Submitting...",
    submitError: "Could not submit right now. Please try again later.",
    title: "Start with SaleMap",
    roleOptions: [
      "Field sales",
      "B2B sales",
      "Telesales / Inside sales",
      "Service sales",
      "Freelancer seller",
      "Founder selling directly",
      "Sales manager",
      "Other",
    ],
    industryOptions: [
      "FMCG / consumer goods",
      "Pharma / pharmacies",
      "Construction materials",
      "Equipment / machinery",
      "Real estate",
      "Insurance / finance",
      "Marketing / website / software",
      "Education / courses",
      "Other B2B services",
      "Other",
    ],
    desiredFeatureOptions: [
      "Find customers near me",
      "Find customers by area",
      "Find customers along a route",
      "Save personal leads",
      "Notes and lead classification",
      "Follow-up reminders",
      "Sales message/script templates",
      "Export Excel/CSV",
    ],
    readinessOptions: [
      "Yes, I am ready to test and give feedback",
      "Yes, but I want to see the product first",
      "Maybe, if it does not take much time",
      "Not ready yet",
    ],
  },
  vi: {
    betaReadinessLabel: "Bạn có sẵn sàng dùng thử SaleMap và góp ý không?",
    betaReadinessPlaceholder: "Chọn mức độ sẵn sàng",
    bullets: [
      "Ưu tiên mời người có nhu cầu bán hàng thực tế",
      "Trao đổi nhanh qua Zalo hoặc email khi có bản dùng thử",
      "Dùng miễn phí trong giai đoạn ra mắt",
    ],
    currentRoleLabel: "Vai trò hiện tại",
    currentRolePlaceholder: "Chọn vai trò",
    desiredFeaturesLabel: "Tính năng muốn dùng nhất",
    emailLabel: "Email",
    featureRequired: "Vui lòng chọn ít nhất một tính năng.",
    formTime: "Thời gian điền form: khoảng 1 phút.",
    fullNameLabel: "Họ tên",
    fullNamePlaceholder: "Nguyễn Văn A",
    industryLabel: "Ngành đang bán",
    industryPlaceholder: "Chọn ngành",
    intro:
      "Để lại thông tin của bạn. Chúng tôi sẽ liên hệ hỗ trợ bạn bắt đầu dùng SaleMap.",
    mainAreaLabel: "Khu vực hoạt động chính",
    mainAreaPlaceholder: "VD: Quận 7, Nhà Bè, Bình Chánh",
    phoneLabel: "Số điện thoại/Zalo",
    phonePlaceholder: "09xx xxx xxx",
    privacy:
      "Thông tin của bạn chỉ dùng để liên hệ hỗ trợ dùng thử SaleMap, không chia sẻ cho bên thứ ba.",
    requiredMessage: "Vui lòng nhập thông tin này.",
    selectMessage: "Vui lòng chọn một lựa chọn.",
    submit: "Gửi đăng ký",
    submitting: "Đang gửi...",
    submitError: "Không thể gửi đăng ký lúc này. Vui lòng thử lại sau.",
    title: "Đăng ký dùng thử",
    roleOptions: [
      "Sale thị trường",
      "Sale B2B",
      "Telesales / Inside sales",
      "Sale dịch vụ",
      "Sale freelancer",
      "Chủ kinh doanh tự đi bán",
      "Quản lý đội sale",
      "Khác",
    ],
    industryOptions: [
      "FMCG / hàng tiêu dùng",
      "Dược / nhà thuốc",
      "Vật liệu xây dựng",
      "Thiết bị / máy móc",
      "Bất động sản",
      "Bảo hiểm / tài chính",
      "Marketing / website / phần mềm",
      "Giáo dục / khóa học",
      "Dịch vụ B2B khác",
      "Khác",
    ],
    desiredFeatureOptions: [
      "Tìm khách quanh tôi",
      "Tìm khách theo khu vực",
      "Tìm khách dọc tuyến đường",
      "Lưu lead cá nhân",
      "Ghi chú và phân loại khách",
      "Nhắc follow-up",
      "Mẫu tin nhắn/kịch bản sale",
      "Xuất Excel/CSV",
    ],
    readinessOptions: [
      "Có, tôi sẵn sàng dùng thử và góp ý",
      "Có, nhưng tôi cần xem sản phẩm trước",
      "Có thể, nếu không mất nhiều thời gian",
      "Chưa sẵn sàng",
    ],
  },
} as const;

function fieldClasses(hasError: boolean, extraClasses?: string) {
  return [
    "mt-2 min-h-12 w-full rounded-lg border bg-white px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-ocean/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
    hasError ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-ocean",
    extraClasses,
  ].join(" ");
}

function errorText(error?: string) {
  if (!error) {
    return null;
  }

  return <p className="mt-2 text-sm font-medium text-red-600">{error}</p>;
}

function getTrackingData() {
  const params = new URLSearchParams(window.location.search);

  return {
    referrer: document.referrer,
    utm_campaign: params.get("utm_campaign") ?? "",
    utm_content: params.get("utm_content") ?? "",
    utm_medium: params.get("utm_medium") ?? "",
    utm_source: params.get("utm_source") ?? "",
  };
}

function mapServerFieldErrors(details?: ApiError["details"]) {
  const nextErrors: FieldErrors = {};

  details?.forEach((detail) => {
    const field = detail.field as keyof BetaSignupData | undefined;

    if (field && detail.message) {
      nextErrors[field] = detail.message;
    }
  });

  return nextErrors;
}

export function BetaFormSection() {
  const router = useRouter();
  const { dictionary, locale } = useLanguage();
  const copy = betaFormCopy[locale];
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedFormStarted = useRef(false);

  function trackFormStartedOnce() {
    if (hasTrackedFormStarted.current) {
      return;
    }

    hasTrackedFormStarted.current = true;
    trackBetaFormStarted();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    trackBetaFormSubmitClicked();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const data: BetaSignupData = {
      betaReadiness: String(formData.get("betaReadiness") ?? "").trim(),
      currentRole: String(formData.get("currentRole") ?? "").trim(),
      desiredFeatures: formData.getAll("desiredFeatures").map(String),
      email: String(formData.get("email") ?? "").trim(),
      fullName: String(formData.get("fullName") ?? "").trim(),
      industry: String(formData.get("industry") ?? "").trim(),
      mainArea: String(formData.get("mainArea") ?? "").trim(),
      phoneZalo: String(formData.get("phoneZalo") ?? "").trim(),
    };

    const nextErrors: FieldErrors = {};

    if (!data.fullName) nextErrors.fullName = copy.requiredMessage;
    if (!data.phoneZalo) nextErrors.phoneZalo = copy.requiredMessage;
    if (!data.currentRole) nextErrors.currentRole = copy.selectMessage;
    if (!data.industry) nextErrors.industry = copy.selectMessage;
    if (!data.mainArea) nextErrors.mainArea = copy.requiredMessage;
    if (data.desiredFeatures.length === 0) {
      nextErrors.desiredFeatures = copy.featureRequired;
    }
    if (!data.betaReadiness) nextErrors.betaReadiness = copy.selectMessage;

    setErrors(nextErrors);
    setFormMessage("");

    if (Object.keys(nextErrors).length > 0) {
      trackBetaFormFailed("VALIDATION_ERROR");
      return;
    }

    setIsSubmitting(true);
    const trackingData = getTrackingData();

    try {
      const response = await fetch("/api/beta-signup", {
        body: JSON.stringify({
          ...data,
          ...trackingData,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const result = (await response.json()) as ApiResponse;

      if (result.success) {
        trackBetaFormSubmitted({
          betaScore: result.data.betaScore,
          currentRole: data.currentRole,
          desiredFeatures: data.desiredFeatures,
          industry: data.industry,
          personaLabel: result.data.personaLabel,
          utmCampaign: trackingData.utm_campaign || null,
          utmMedium: trackingData.utm_medium || null,
          utmSource: trackingData.utm_source || null,
        });
        router.push("/cam-on");
        return;
      }

      trackBetaFormFailed(result.error.code);

      if (result.error.code === "VALIDATION_ERROR") {
        const serverFieldErrors = mapServerFieldErrors(result.error.details);
        setErrors(serverFieldErrors);
        setFormMessage(result.error.message);
        return;
      }

      setFormMessage(result.error.message);
    } catch {
      trackBetaFormFailed("UNKNOWN_ERROR");
      setFormMessage(copy.submitError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="scroll-mt-20 bg-cloud px-4 py-16 sm:px-6 lg:px-8"
      id="dang-ky"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            {dictionary.common.beta}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            {copy.intro}
          </p>
          <div className="mt-8 space-y-3">
            {copy.bullets.map((item) => (
              <div className="flex gap-3 text-sm font-medium text-slate-700" key={item}>
                <CheckCircle2
                  aria-hidden="true"
                  className="h-5 w-5 flex-none text-mint"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <form
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft sm:p-6"
          data-clarity-mask="true"
          noValidate
          onChangeCapture={trackFormStartedOnce}
          onFocusCapture={trackFormStartedOnce}
          onSubmit={handleSubmit}
        >
          <p className="mb-5 rounded-lg bg-mint/10 px-4 py-3 text-sm font-bold text-ocean">
            {copy.formTime}
          </p>

          {formMessage ? (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
              {formMessage}
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-sm font-bold text-ink sm:text-base">
              {copy.fullNameLabel}
              <input
                aria-invalid={Boolean(errors.fullName)}
                autoComplete="name"
                className={fieldClasses(Boolean(errors.fullName), "clarity-mask")}
                disabled={isSubmitting}
                name="fullName"
                placeholder={copy.fullNamePlaceholder}
                required
                type="text"
              />
              {errorText(errors.fullName)}
            </label>

            <label className="text-sm font-bold text-ink sm:text-base">
              {copy.phoneLabel}
              <input
                aria-invalid={Boolean(errors.phoneZalo)}
                autoComplete="tel"
                className={fieldClasses(Boolean(errors.phoneZalo), "clarity-mask")}
                disabled={isSubmitting}
                name="phoneZalo"
                placeholder={copy.phonePlaceholder}
                required
                type="tel"
              />
              {errorText(errors.phoneZalo)}
            </label>

            <label className="text-sm font-bold text-ink sm:text-base">
              {copy.emailLabel}
              <input
                aria-invalid={Boolean(errors.email)}
                autoComplete="email"
                className={fieldClasses(Boolean(errors.email), "clarity-mask")}
                disabled={isSubmitting}
                name="email"
                placeholder="ban@email.com"
                type="email"
              />
              {errorText(errors.email)}
            </label>

            <label className="text-sm font-bold text-ink sm:text-base">
              {copy.currentRoleLabel}
              <select
                aria-invalid={Boolean(errors.currentRole)}
                className={fieldClasses(Boolean(errors.currentRole))}
                defaultValue=""
                disabled={isSubmitting}
                name="currentRole"
                required
              >
                <option value="">{copy.currentRolePlaceholder}</option>
                {copy.roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errorText(errors.currentRole)}
            </label>

            <label className="text-sm font-bold text-ink sm:text-base">
              {copy.industryLabel}
              <select
                aria-invalid={Boolean(errors.industry)}
                className={fieldClasses(Boolean(errors.industry))}
                defaultValue=""
                disabled={isSubmitting}
                name="industry"
                required
              >
                <option value="">{copy.industryPlaceholder}</option>
                {copy.industryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errorText(errors.industry)}
            </label>

            <label className="text-sm font-bold text-ink sm:text-base">
              {copy.mainAreaLabel}
              <input
                aria-invalid={Boolean(errors.mainArea)}
                className={fieldClasses(Boolean(errors.mainArea))}
                disabled={isSubmitting}
                name="mainArea"
                placeholder={copy.mainAreaPlaceholder}
                required
                type="text"
              />
              {errorText(errors.mainArea)}
            </label>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-bold text-ink sm:text-base">
              {copy.desiredFeaturesLabel}
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {copy.desiredFeatureOptions.map((option) => (
                <label
                  className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-cloud px-3 py-2.5 text-sm font-medium leading-6 text-slate-700 sm:text-base"
                  key={option}
                >
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-ocean focus:ring-ocean disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                    name="desiredFeatures"
                    type="checkbox"
                    value={option}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {errorText(errors.desiredFeatures)}
          </fieldset>

          <label className="mt-6 block text-sm font-bold text-ink sm:text-base">
            {copy.betaReadinessLabel}
            <select
              aria-invalid={Boolean(errors.betaReadiness)}
              className={fieldClasses(Boolean(errors.betaReadiness))}
              defaultValue=""
              disabled={isSubmitting}
              name="betaReadiness"
              required
            >
              <option value="">{copy.betaReadinessPlaceholder}</option>
              {copy.readinessOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errorText(errors.betaReadiness)}
          </label>

          <div className="mt-7">
            <Button
              className="w-full"
              disabled={isSubmitting}
              icon={<ArrowRight aria-hidden="true" className="h-5 w-5" />}
              size="lg"
              type="submit"
              variant="accent"
            >
              {isSubmitting ? copy.submitting : copy.submit}
            </Button>
            <p className="mt-3 text-center text-sm leading-6 text-slate-500">
              {copy.privacy}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
