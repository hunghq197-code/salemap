import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import {
  DATA_QUALITY_ISSUES,
  type DataQualityIssueType,
} from "@/lib/constants/lead-cleanup";

export type DataQualitySeverity = "important" | "info" | "warning";
export type DataQualityStatus = "dismissed" | "open" | "resolved";

export type LeadDataQualityIssue = {
  field_name: string | null;
  issue_type: DataQualityIssueType;
  message: string;
  severity: DataQualitySeverity;
  suggested_value?: string | null;
};

export type DataQualityIssueRecord = LeadDataQualityIssue & {
  created_at: string | null;
  id: string;
  lead_id: string;
  leads?: {
    id: string;
    name: string;
    status: string | null;
  } | null;
  status: DataQualityStatus;
};

type LeadForQuality = {
  address: string | null;
  category: string | null;
  created_at: string | null;
  email: string | null;
  id: string;
  last_contacted_at: string | null;
  name: string;
  next_follow_up_at: string | null;
  phone: string | null;
  status: string | null;
  website: string | null;
};

function digitsOnly(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidWebsite(value: string) {
  const clean = value.trim();

  if (!clean) {
    return true;
  }

  try {
    const url = new URL(/^https?:\/\//i.test(clean) ? clean : `https://${clean}`);
    return Boolean(url.hostname.includes("."));
  } catch {
    return false;
  }
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.getTime();
}

function isOlderThan(value: string | null | undefined, days: number) {
  if (!value) {
    return true;
  }

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time < daysAgo(days) : true;
}

function isOpenStatus(status?: string | null) {
  return ["contacted", "follow_up", "interested", "new"].includes(status || "new");
}

function issue(
  issue_type: DataQualityIssueType,
  field_name: string | null,
  severity: DataQualitySeverity,
  message: string,
  suggested_value?: string | null,
): LeadDataQualityIssue {
  return {
    field_name,
    issue_type,
    message,
    severity,
    suggested_value: suggested_value ?? null,
  };
}

export function scanLeadDataQuality(lead: LeadForQuality): LeadDataQualityIssue[] {
  const issues: LeadDataQualityIssue[] = [];
  const hasPhone = Boolean(lead.phone?.trim());
  const hasEmail = Boolean(lead.email?.trim());

  if (!hasPhone && !hasEmail) {
    issues.push(
      issue(
        "missing_phone",
        "phone",
        "warning",
        "Lead chưa có số điện thoại hoặc email để liên hệ.",
      ),
    );
  }

  if (hasPhone && digitsOnly(lead.phone).length < 9) {
    issues.push(
      issue("invalid_phone", "phone", "important", "Số điện thoại có vẻ chưa đúng định dạng."),
    );
  }

  if (hasEmail && !isValidEmail(lead.email || "")) {
    issues.push(issue("invalid_email", "email", "important", "Email chưa đúng định dạng."));
  }

  if (lead.website && !isValidWebsite(lead.website)) {
    issues.push(
      issue("invalid_website", "website", "warning", "Website chưa đúng định dạng URL."),
    );
  }

  if (!lead.status) {
    issues.push(issue("missing_status", "status", "warning", "Lead chưa có trạng thái."));
  }

  if (!lead.category) {
    issues.push(
      issue("missing_category", "category", "warning", "Lead chưa có ngành hoặc loại khách."),
    );
  }

  if (!lead.address) {
    issues.push(issue("missing_address", "address", "info", "Lead chưa có địa chỉ."));
  }

  if (isOpenStatus(lead.status) && !lead.next_follow_up_at && isOlderThan(lead.created_at, 7)) {
    issues.push(
      issue(
        "missing_follow_up",
        "next_follow_up_at",
        "warning",
        "Lead đang mở nhưng chưa có lịch follow-up.",
      ),
    );
  }

  if (
    isOpenStatus(lead.status) &&
    !["lost", "not_fit", "won"].includes(lead.status || "") &&
    isOlderThan(lead.last_contacted_at || lead.created_at, 30)
  ) {
    issues.push(
      issue("stale_lead", "last_contacted_at", "info", "Lead đã lâu chưa được chăm sóc."),
    );
  }

  return issues;
}

function issueKey(leadId: string, issueType: string, fieldName?: string | null) {
  return `${leadId}|${issueType}|${fieldName || ""}`;
}

function isMissingCleanupSchema(error: { code?: string }) {
  return error.code === "42P01";
}

export async function scanLeadDataQualityForUser(userId: string) {
  const { supabase } = await createAuthedSupabaseServerClient();
  const { data: leads, error: leadError } = await supabase
    .from("leads")
    .select(
      "id,name,phone,email,website,address,status,category,created_at,last_contacted_at,next_follow_up_at",
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .is("merged_at", null)
    .limit(5000);

  if (leadError) {
    if (leadError.code === "42703") {
      throw new Error("Chưa chạy SQL lead-cleanup-bulk-actions-schema.sql.");
    }

    throw new Error(leadError.message);
  }

  const leadRows = (leads ?? []) as LeadForQuality[];
  const leadIds = leadRows.map((lead) => lead.id);
  let existing = new Set<string>();

  if (leadIds.length > 0) {
    const { data: issues, error: issuesError } = await supabase
      .from("lead_data_quality_issues")
      .select("lead_id,issue_type,field_name")
      .eq("user_id", userId)
      .eq("status", "open")
      .in("lead_id", leadIds);

    if (issuesError) {
      if (isMissingCleanupSchema(issuesError)) {
        throw new Error("Chưa chạy SQL lead-cleanup-bulk-actions-schema.sql.");
      }

      throw new Error(issuesError.message);
    }

    existing = new Set(
      (issues ?? []).map((row) =>
        issueKey(String(row.lead_id), String(row.issue_type), row.field_name as string | null),
      ),
    );
  }

  const rowsToInsert = leadRows.flatMap((lead) =>
    scanLeadDataQuality(lead)
      .filter((item) => !existing.has(issueKey(lead.id, item.issue_type, item.field_name)))
      .map((item) => ({
        ...item,
        lead_id: lead.id,
        status: "open",
        user_id: userId,
      })),
  );

  if (rowsToInsert.length > 0) {
    const { error } = await supabase.from("lead_data_quality_issues").insert(rowsToInsert);

    if (error) {
      throw new Error(error.message);
    }
  }

  const { data: openIssues, error: countError } = await supabase
    .from("lead_data_quality_issues")
    .select("severity")
    .eq("user_id", userId)
    .eq("status", "open")
    .limit(5000);

  if (countError) {
    throw new Error(countError.message);
  }

  return {
    importantIssues: (openIssues ?? []).filter((item) => item.severity === "important").length,
    infoIssues: (openIssues ?? []).filter((item) => item.severity === "info").length,
    openIssues: openIssues?.length ?? 0,
    warningIssues: (openIssues ?? []).filter((item) => item.severity === "warning").length,
  };
}

export async function getDataQualityIssues(params: {
  page?: number;
  status?: string;
  type?: string;
} = {}) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 30;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let query = supabase
    .from("lead_data_quality_issues")
    .select(
      "id,lead_id,issue_type,field_name,severity,message,suggested_value,status,created_at,leads(id,name,status)",
      { count: "exact" },
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.type) {
    query = query.eq("issue_type", params.type);
  }

  const { count, data, error } = await query.range(from, to);

  if (error) {
    if (isMissingCleanupSchema(error)) {
      return { items: [] as DataQualityIssueRecord[], limit, page, total: 0, totalPages: 1 };
    }

    throw new Error(error.message);
  }

  return {
    items: (data ?? []) as unknown as DataQualityIssueRecord[],
    limit,
    page,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

async function updateDataQualityIssueStatus(issueId: string, status: "dismissed" | "resolved") {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const now = new Date().toISOString();
  const payload =
    status === "resolved"
      ? { resolved_at: now, status, updated_at: now }
      : { dismissed_at: now, status, updated_at: now };
  const { data, error } = await supabase
    .from("lead_data_quality_issues")
    .update(payload)
    .eq("id", issueId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Không tìm thấy cảnh báo dữ liệu.");
  }
}

export async function resolveDataQualityIssue(issueId: string) {
  await updateDataQualityIssueStatus(issueId, "resolved");
}

export async function dismissDataQualityIssue(issueId: string) {
  await updateDataQualityIssueStatus(issueId, "dismissed");
}

export function getDataQualityIssueLabel(issueType?: string | null) {
  return issueType && issueType in DATA_QUALITY_ISSUES
    ? DATA_QUALITY_ISSUES[issueType as DataQualityIssueType]
    : issueType || "Cần xem lại";
}
