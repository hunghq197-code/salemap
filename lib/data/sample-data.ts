import { createAuthedSupabaseServerClient } from "@/lib/data/auth";

type SampleDataResult = {
  createdLeads: number;
  status: "created" | "skipped";
};

const sampleTags = [
  { color: "#ef4444", name: "Khách nóng" },
  { color: "#0f5f8f", name: "Hẹn lại" },
  { color: "#f59e0b", name: "Đã báo giá" },
  { color: "#10b981", name: "Tiềm năng cao" },
];

const sampleLeads = [
  {
    address: "Quận 1, TP.HCM",
    category: "Nhà thuốc",
    name: "Nhà thuốc Minh An",
    note_summary: "Quan tâm phần mềm quản lý khách quay lại.",
    phone: "0901000001",
    priority: "high",
    source: "sample_beta",
    status: "interested",
  },
  {
    address: "Quận Bình Thạnh, TP.HCM",
    category: "Tạp hóa",
    name: "Tạp hóa Cô Lan",
    note_summary: "Cần gọi lại vào cuối tuần.",
    phone: "0901000002",
    priority: "medium",
    source: "sample_beta",
    status: "follow_up",
  },
  {
    address: "Quận 3, TP.HCM",
    category: "Spa",
    name: "Spa An Nhiên",
    note_summary: "Đã hỏi bảng giá gói chăm sóc khách.",
    phone: "0901000003",
    priority: "high",
    source: "sample_beta",
    status: "contacted",
  },
  {
    address: "TP. Thủ Đức, TP.HCM",
    category: "Thiết bị",
    name: "Công ty Thiết Bị Nam Phát",
    note_summary: "Cần demo nhanh quy trình lưu lead.",
    phone: "0901000004",
    priority: "medium",
    source: "sample_beta",
    status: "new",
  },
  {
    address: "Quận 7, TP.HCM",
    category: "Vật liệu xây dựng",
    name: "Đại lý Vật liệu Hòa Bình",
    note_summary: "Có tiềm năng nhưng cần hẹn lại.",
    phone: "0901000005",
    priority: "medium",
    source: "sample_beta",
    status: "follow_up",
  },
];

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

export async function createSampleDataForCurrentUser(): Promise<SampleDataResult> {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { count, error: countError } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) > 0) {
    return { createdLeads: 0, status: "skipped" };
  }

  const { data: tags, error: tagError } = await supabase
    .from("tags")
    .upsert(
      sampleTags.map((tag) => ({
        ...tag,
        user_id: userId,
      })),
      { onConflict: "user_id,name" },
    )
    .select("id,name");

  if (tagError) {
    throw new Error(tagError.message);
  }

  const { data: leads, error: leadError } = await supabase
    .from("leads")
    .insert(
      sampleLeads.map((lead, index) => ({
        ...lead,
        next_follow_up_at: index < 2 ? daysFromNow(index + 1) : null,
        user_id: userId,
      })),
    )
    .select("id,name");

  if (leadError) {
    throw new Error(leadError.message);
  }

  const leadRows = leads ?? [];
  const tagRows = tags ?? [];
  const hotTag = tagRows.find((tag) => tag.name === "Khách nóng")?.id;
  const followTag = tagRows.find((tag) => tag.name === "Hẹn lại")?.id;
  const quotedTag = tagRows.find((tag) => tag.name === "Đã báo giá")?.id;
  const potentialTag = tagRows.find((tag) => tag.name === "Tiềm năng cao")?.id;
  const leadTagRows = [
    { leadId: leadRows[0]?.id, tagId: hotTag },
    { leadId: leadRows[0]?.id, tagId: potentialTag },
    { leadId: leadRows[1]?.id, tagId: followTag },
    { leadId: leadRows[2]?.id, tagId: quotedTag },
    { leadId: leadRows[4]?.id, tagId: followTag },
  ]
    .filter((item): item is { leadId: string; tagId: string } =>
      Boolean(item.leadId && item.tagId),
    )
    .map((item) => ({
      lead_id: item.leadId,
      tag_id: item.tagId,
    }));

  if (leadTagRows.length > 0) {
    const { error: leadTagError } = await supabase.from("lead_tags").insert(leadTagRows);

    if (leadTagError) {
      throw new Error(leadTagError.message);
    }
  }

  const noteRows = leadRows.slice(0, 3).map((lead, index) => ({
    content:
      index === 0
        ? "Khách hỏi cách theo dõi lịch gọi lại và ghi chú sau mỗi lần trao đổi."
        : index === 1
          ? "Cô Lan bận bán hàng, hẹn gọi lại vào sáng mai."
          : "Spa muốn xem demo cách lưu khách từ bản đồ thành lead.",
    interaction_type: index === 1 ? "call" : "meeting",
    lead_id: lead.id,
    outcome: index === 0 ? "interested" : "follow_up",
    status_after: index === 0 ? "interested" : "follow_up",
    status_before: "new",
    user_id: userId,
  }));

  if (noteRows.length > 0) {
    const { error: noteError } = await supabase.from("lead_notes").insert(noteRows);

    if (noteError) {
      throw new Error(noteError.message);
    }
  }

  const reminderRows = leadRows.slice(0, 2).map((lead, index) => ({
    description: "Dữ liệu mẫu: gọi lại để xác nhận nhu cầu.",
    lead_id: lead.id,
    remind_at: daysFromNow(index + 1),
    status: "pending",
    title: `Follow-up ${lead.name}`,
    user_id: userId,
  }));

  if (reminderRows.length > 0) {
    const { error: reminderError } = await supabase.from("reminders").insert(reminderRows);

    if (reminderError) {
      throw new Error(reminderError.message);
    }
  }

  return { createdLeads: leadRows.length, status: "created" };
}
