import { NextResponse } from "next/server";
import { z } from "zod";
import { submitBetaRound2Survey } from "@/lib/data/surveys";
import {
  SURVEY_CONTINUE_OPTIONS,
  SURVEY_PAY_OPTIONS,
  SURVEY_USEFUL_FEATURE_OPTIONS,
} from "@/lib/constants/surveys";

const surveySchema = z.object({
  mostConfusingPart: z.string().max(1000).optional(),
  mostUsefulFeature: z.enum(SURVEY_USEFUL_FEATURE_OPTIONS),
  npsScore: z.number().int().min(0).max(10),
  openFeedback: z.string().max(1500).optional(),
  rating: z.number().int().min(1).max(5),
  willingnessToPay: z.enum(SURVEY_PAY_OPTIONS),
  wouldContinueUsing: z.enum(SURVEY_CONTINUE_OPTIONS),
});

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { status },
  );
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = surveySchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Vui lòng kiểm tra lại khảo sát.");
  }

  try {
    const id = await submitBetaRound2Survey(parsed.data);

    return NextResponse.json({
      data: { id },
      success: true,
    });
  } catch {
    return errorResponse(
      "SURVEY_SUBMIT_FAILED",
      "Không thể gửi khảo sát lúc này. Vui lòng thử lại.",
      500,
    );
  }
}
