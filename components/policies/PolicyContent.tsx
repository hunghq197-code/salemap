"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type PolicyKind = "privacy" | "terms";

type PolicySection = {
  content: string;
  title: string;
};

type PolicyCopy = {
  back: string;
  intro: string;
  sections: PolicySection[];
  title: string;
};

const policyCopy: Record<PolicyKind, Record<"en" | "vi", PolicyCopy>> = {
  privacy: {
    en: {
      back: "Back to homepage",
      intro:
        "Last updated: 09/07/2026. This content applies to the SaleMap website and user registration.",
      title: "Privacy Policy",
      sections: [
        {
          title: "1. Introduction",
          content:
            "SaleMap respects user privacy. This policy explains how we collect, use, and protect information when you visit the website or sign up.",
        },
        {
          title: "2. Information we collect",
          content:
            "When you sign up, we may collect your name, phone/Zalo, email, work role, industry, operating area, and the product features you are interested in.",
        },
        {
          title: "3. How we use information",
          content:
            "Signup information is used to contact interested users, support product feedback, and improve the website experience.",
        },
        {
          title: "4. Signup data",
          content:
            "Signup information is only used to contact you about SaleMap access. We do not use this data for spam and do not sell personal information to third parties.",
        },
        {
          title: "5. Analytics data",
          content:
            "The website may use PostHog and Microsoft Clarity to understand actions such as CTA clicks, form starts, form submits, or FAQ opens. We do not send names, phone/Zalo numbers, or emails to PostHog.",
        },
        {
          title: "6. Data protection",
          content:
            "We apply reasonable technical measures to reduce unauthorized access, including keeping sensitive keys in server environment variables and limiting personal data in analytics tools.",
        },
        {
          title: "7. Data sharing",
          content:
            "We do not sell personal information. Data may be processed by infrastructure or analytics providers needed to operate SaleMap within the scope of the service.",
        },
        {
          title: "8. User rights",
          content:
            "You may request to view, edit, or delete your signup information. When we receive a valid request, we will process it within reasonable technical and operational limits.",
        },
        {
          title: "9. Contact",
          content:
            "For privacy questions or signup data deletion requests, contact hello@salemap.vn.",
        },
      ],
    },
    vi: {
      back: "Quay lại trang chủ",
      intro:
        "Cập nhật gần nhất: 09/07/2026. Nội dung này áp dụng cho website và hoạt động đăng ký người dùng của SaleMap.",
      title: "Chính sách bảo mật",
      sections: [
        {
          title: "1. Giới thiệu",
          content:
            "SaleMap tôn trọng quyền riêng tư của người dùng. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin khi bạn truy cập website hoặc đăng ký sử dụng.",
        },
        {
          title: "2. Thông tin chúng tôi thu thập",
          content:
            "Khi bạn đăng ký, chúng tôi có thể thu thập họ tên, số điện thoại/Zalo, email, vai trò công việc, ngành đang bán, khu vực hoạt động và các tính năng bạn quan tâm.",
        },
        {
          title: "3. Mục đích sử dụng thông tin",
          content:
            "Thông tin đăng ký được dùng để liên hệ hỗ trợ dùng thử, tiếp nhận phản hồi sản phẩm và cải thiện trải nghiệm website.",
        },
        {
          title: "4. Dữ liệu đăng ký",
          content:
            "Thông tin đăng ký chỉ dùng để liên hệ hỗ trợ sử dụng SaleMap. Chúng tôi không dùng dữ liệu này để gửi spam và không bán thông tin cá nhân cho bên thứ ba.",
        },
        {
          title: "5. Dữ liệu analytics",
          content:
            "Website có thể sử dụng PostHog và Microsoft Clarity để hiểu hành vi sử dụng như lượt click CTA, bắt đầu điền form, submit form hoặc mở FAQ. Chúng tôi không gửi họ tên, số điện thoại/Zalo hoặc email lên PostHog.",
        },
        {
          title: "6. Bảo mật dữ liệu",
          content:
            "Chúng tôi áp dụng các biện pháp kỹ thuật hợp lý để hạn chế truy cập trái phép, bao gồm lưu khóa nhạy cảm ở biến môi trường server và hạn chế dữ liệu cá nhân trong công cụ analytics.",
        },
        {
          title: "7. Chia sẻ dữ liệu",
          content:
            "Chúng tôi không bán thông tin cá nhân. Dữ liệu có thể được xử lý bởi các nhà cung cấp hạ tầng hoặc analytics cần thiết để vận hành website, theo phạm vi phục vụ SaleMap.",
        },
        {
          title: "8. Quyền của người dùng",
          content:
            "Bạn có thể yêu cầu xem, chỉnh sửa hoặc xóa thông tin đăng ký của mình. Khi nhận được yêu cầu hợp lệ, chúng tôi sẽ xử lý trong phạm vi kỹ thuật và vận hành hợp lý.",
        },
        {
          title: "9. Liên hệ",
          content:
            "Nếu có câu hỏi về quyền riêng tư hoặc muốn yêu cầu xóa thông tin đăng ký, bạn có thể liên hệ qua email hello@salemap.vn.",
        },
      ],
    },
  },
  terms: {
    en: {
      back: "Back to homepage",
      intro:
        "Last updated: 09/07/2026. This content applies to the SaleMap website and service.",
      title: "Terms of Use",
      sections: [
        {
          title: "1. Introduction",
          content:
            "These terms apply when you visit the SaleMap website or register for the service. By using the website, you agree to follow the basic terms below.",
        },
        {
          title: "2. Product status",
          content:
            "SaleMap is live and continues to improve. Some features may evolve, change, pause, or not be available to every account at all times.",
        },
        {
          title: "3. Scope of use",
          content:
            "The website introduces the product, receives signups, and helps us contact interested users. Some commercial features may be opened gradually.",
        },
        {
          title: "4. User responsibility",
          content:
            "You should provide reasonably accurate signup information and must not use SaleMap for illegal activity, spam, data abuse, or actions that harm others.",
        },
        {
          title: "5. Limitation of responsibility",
          content:
            "SaleMap does not guarantee that data, features, or new experiences will work perfectly 100% of the time. You should evaluate the product before relying on it for important decisions.",
        },
        {
          title: "6. Product changes",
          content:
            "We may adjust features, interface, availability, or related terms as the product evolves. Important changes will be updated on the website or communicated when appropriate.",
        },
        {
          title: "7. Contact",
          content:
            "For questions about these terms or SaleMap, contact hello@salemap.vn.",
        },
      ],
    },
    vi: {
      back: "Quay lại trang chủ",
      intro:
        "Cập nhật gần nhất: 09/07/2026. Nội dung này áp dụng cho website và dịch vụ SaleMap.",
      title: "Điều khoản sử dụng",
      sections: [
        {
          title: "1. Giới thiệu",
          content:
            "Các điều khoản này áp dụng khi bạn truy cập website SaleMap hoặc đăng ký sử dụng dịch vụ. Khi sử dụng website, bạn đồng ý tuân thủ các điều khoản cơ bản dưới đây.",
        },
        {
          title: "2. Trạng thái sản phẩm",
          content:
            "SaleMap đã sẵn sàng sử dụng và vẫn tiếp tục được cải thiện. Một số tính năng có thể được mở dần, thay đổi hoặc tạm ngừng để đảm bảo chất lượng.",
        },
        {
          title: "3. Phạm vi sử dụng",
          content:
            "Website phục vụ mục đích giới thiệu sản phẩm, tiếp nhận đăng ký và liên hệ người dùng quan tâm. Một số tính năng thương mại có thể được mở dần theo kế hoạch.",
        },
        {
          title: "4. Trách nhiệm của người dùng",
          content:
            "Bạn cần cung cấp thông tin đăng ký chính xác trong phạm vi có thể, không sử dụng SaleMap cho hành vi vi phạm pháp luật, spam, lạm dụng dữ liệu hoặc gây hại cho người khác.",
        },
        {
          title: "5. Giới hạn trách nhiệm",
          content:
            "SaleMap không cam kết dữ liệu, tính năng hoặc trải nghiệm mới sẽ hoạt động hoàn hảo 100%. Bạn nên tự đánh giá trước khi dựa vào thông tin từ sản phẩm cho quyết định quan trọng.",
        },
        {
          title: "6. Thay đổi sản phẩm",
          content:
            "Chúng tôi có thể điều chỉnh tính năng, giao diện, phạm vi cung cấp hoặc các điều khoản liên quan khi sản phẩm phát triển. Các thay đổi quan trọng sẽ được cập nhật trên website hoặc thông báo khi phù hợp.",
        },
        {
          title: "7. Liên hệ",
          content:
            "Nếu có câu hỏi về điều khoản sử dụng hoặc SaleMap, bạn có thể liên hệ qua email hello@salemap.vn.",
        },
      ],
    },
  },
};

export function PolicyContent({ kind }: { kind: PolicyKind }) {
  const { locale } = useLanguage();
  const copy = policyCopy[kind][locale];

  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="bg-cloud px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Link
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ocean transition hover:text-ink"
              href="/"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              {copy.back}
            </Link>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
              SaleMap
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-ink sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              {copy.intro}
            </p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-8">
              {copy.sections.map((section) => (
                <section
                  className="border-b border-slate-200 pb-8 last:border-b-0"
                  key={section.title}
                >
                  <h2 className="text-xl font-bold leading-7 text-ink">
                    {section.title}
                  </h2>
                  <p className="mt-3 text-base leading-8 text-slate-600">
                    {section.content}
                  </p>
                </section>
              ))}
            </div>

            <div className="mt-10 border-t border-slate-200 pt-8">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-sm font-semibold text-ink shadow-soft transition hover:bg-[#5de0b3] focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2"
                href="/"
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                {copy.back}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
