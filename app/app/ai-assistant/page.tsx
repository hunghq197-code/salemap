import { Bot } from "lucide-react";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { FeatureDisabledNotice } from "@/components/ui/FeatureDisabledNotice";
import { isFeatureEnabled } from "@/lib/data/feature-flags";

export const dynamic = "force-dynamic";

export default async function AIAssistantPage() {
  const enabled = await isFeatureEnabled("ai_assistant");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
          <Bot aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            AI assistant
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Trợ lý AI SaleMap
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            Tạo nhanh tin nhắn, email, follow-up và cách xử lý từ chối dựa trên tình huống bán hàng.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {enabled ? (
          <AIAssistantPanel title="Tạo nội dung bán hàng" />
        ) : (
          <FeatureDisabledNotice flagKey="ai_assistant" />
        )}
      </div>
    </div>
  );
}
