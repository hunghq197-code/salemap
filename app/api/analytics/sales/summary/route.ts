import { NextResponse } from "next/server";
import {
  calculateSalesMetricsForUser,
  getDateRangeForPeriod,
  getPreviousDateRange,
} from "@/lib/analytics/sales-analytics";
import { getPinnedSalesGoals } from "@/lib/data/sales-goals";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { analyticsPeriodSchema } from "@/lib/validators/sales-analytics";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

function changePercent(current: number, previous: number) {
  if (previous <= 0) {
    return null;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function serializeMetrics(metrics: Awaited<ReturnType<typeof calculateSalesMetricsForUser>>["metrics"]) {
  return {
    aiRequests: metrics.ai_requests,
    areaSearches: metrics.area_searches,
    exportsCompleted: metrics.exports_completed,
    followupsCompleted: metrics.followups_completed,
    followupsCreated: metrics.followups_created,
    importRowsCompleted: metrics.import_rows_completed,
    leadsContacted: metrics.leads_contacted,
    leadsCreated: metrics.leads_created,
    leadsLost: metrics.leads_lost,
    leadsNotFit: metrics.leads_not_fit,
    leadsWon: metrics.leads_won,
    mapLeadsSaved: metrics.map_leads_saved,
    nearMeSearches: metrics.near_me_searches,
    notesCreated: metrics.lead_notes_created,
    overdueFollowups: metrics.overdue_followups,
    pipelineStatusChanges: metrics.pipeline_status_changes,
    routeSearches: metrics.route_searches,
    templatesCopied: metrics.templates_copied,
  };
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const url = new URL(request.url);
  const parsed = analyticsPeriodSchema.safeParse({
    customFrom: url.searchParams.get("customFrom") || undefined,
    customTo: url.searchParams.get("customTo") || undefined,
    period: url.searchParams.get("period") || "last_7_days",
  });

  if (!parsed.success) {
    return jsonError("INVALID_PERIOD");
  }

  const range = getDateRangeForPeriod(parsed.data);
  const previousRange = getPreviousDateRange(range);
  const [summary, previousSummary, goals] = await Promise.all([
    calculateSalesMetricsForUser(user.id, parsed.data),
    calculateSalesMetricsForUser(user.id, {
      customFrom: dateOnly(previousRange.start),
      customTo: dateOnly(addDays(previousRange.end, -1)),
      period: "custom",
    }),
    getPinnedSalesGoals(),
  ]);

  return NextResponse.json({
    data: {
      comparisons: {
        followupsCompletedChangePercent: changePercent(
          summary.metrics.followups_completed,
          previousSummary.metrics.followups_completed,
        ),
        leadsCreatedChangePercent: changePercent(
          summary.metrics.leads_created,
          previousSummary.metrics.leads_created,
        ),
        leadsWonChangePercent: changePercent(
          summary.metrics.leads_won,
          previousSummary.metrics.leads_won,
        ),
      },
      goals: goals.items,
      metrics: serializeMetrics(summary.metrics),
      rates: summary.rates,
    },
    success: true,
  });
}
