import type { LeadRecord } from "@/lib/data/leads";
import type { LeadNoteRecord } from "@/lib/data/lead-notes";
import type { TemplateRecord } from "@/lib/data/templates";
import type { AIGenerateInput } from "@/lib/validators/ai";

export const SALES_AI_SYSTEM_PROMPT = `Bạn là trợ lý hỗ trợ người làm sale tại Việt Nam.

Nhiệm vụ của bạn là giúp người dùng viết tin nhắn, email, kịch bản follow-up và gợi ý bước tiếp theo dựa trên thông tin lead.

Nguyên tắc:
- Viết bằng tiếng Việt tự nhiên.
- Ngắn gọn, rõ ý, lịch sự.
- Không hứa hẹn quá mức.
- Không bịa thông tin không có trong dữ liệu.
- Không dùng giọng spam.
- Không gây áp lực quá mạnh với khách.
- Nếu thiếu thông tin, hãy viết theo hướng trung tính.
- Output phải dễ copy để gửi qua Zalo, email hoặc dùng trong cuộc gọi.`;

const toneLabels: Record<string, string> = {
  direct: "trực tiếp",
  friendly: "thân thiện",
  persuasive: "thuyết phục",
  professional: "chuyên nghiệp",
  short: "ngắn gọn",
  warm: "ấm áp",
};

const channelLabels: Record<string, string> = {
  direct: "trao đổi trực tiếp",
  email: "email",
  other: "kênh khác",
  phone: "cuộc gọi",
  zalo: "Zalo",
};

const objectionLabels: Record<string, string> = {
  call_later: "khách hẹn gọi lại",
  need_more_time: "khách cần thêm thời gian",
  no_need: "khách nói chưa có nhu cầu",
  not_decision_maker: "người trao đổi không phải người quyết định",
  other: "từ chối khác",
  price_high: "khách nói giá cao",
  send_info_first: "khách muốn gửi thông tin trước",
  using_competitor: "khách đang dùng đối thủ",
};

export function getAIOutputType(requestType: string) {
  const outputTypes: Record<string, string> = {
    handle_objection: "objection_response",
    make_message_more_professional: "other",
    make_message_warmer: "other",
    personalize_template: "other",
    rewrite_message: "other",
    shorten_message: "other",
    suggest_next_step: "next_step",
    summarize_notes: "lead_summary",
    write_email: "email",
    write_follow_up: "follow_up",
    write_zalo_message: "zalo_message",
  };

  return outputTypes[requestType] || "other";
}

function line(label: string, value?: string | number | null) {
  return value ? `- ${label}: ${value}` : "";
}

export function buildLeadContextPrompt(lead?: LeadRecord | null, notes?: LeadNoteRecord[]) {
  if (!lead) {
    return "Không có lead cụ thể. Hãy viết mẫu chung, trung tính và dễ chỉnh sửa.";
  }

  const recentNotes = (notes ?? [])
    .slice(0, 5)
    .map((note, index) => `${index + 1}. ${note.content.slice(0, 500)}`)
    .join("\n");

  return [
    "Thông tin lead:",
    line("Tên lead", lead.name),
    line("Ngành/loại khách", lead.category),
    line("Trạng thái", lead.status),
    line("Mức ưu tiên", lead.priority),
    line("Nguồn lead", lead.source),
    line("Ghi chú tóm tắt", lead.note_summary),
    line("Follow-up tiếp theo", lead.next_follow_up_at),
    recentNotes ? `Ghi chú gần nhất:\n${recentNotes}` : "Ghi chú gần nhất: chưa có",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSharedInstruction(input: AIGenerateInput) {
  return [
    line("Kênh sử dụng", channelLabels[input.channel || ""] || input.channel),
    line("Giọng văn", toneLabels[input.tone || ""] || input.tone),
    line("Yêu cầu thêm", input.customInstruction),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildTemplateContext(template?: TemplateRecord | null) {
  if (!template) {
    return "";
  }

  return [
    "Template gốc:",
    line("Tiêu đề", template.title),
    line("Kênh", template.channel),
    line("Tình huống", template.situation),
    "Nội dung:",
    template.content,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAIPrompt(input: {
  lead?: LeadRecord | null;
  notes?: LeadNoteRecord[];
  request: AIGenerateInput;
  template?: TemplateRecord | null;
}) {
  const leadContext = buildLeadContextPrompt(input.lead, input.notes);
  const shared = buildSharedInstruction(input.request);
  const templateContext = buildTemplateContext(input.template);
  const requestType = input.request.requestType;

  const taskMap: Record<string, string> = {
    handle_objection: `Gợi ý cách phản hồi khi khách từ chối. Loại từ chối: ${
      objectionLabels[input.request.objectionType || "other"]
    }.`,
    make_message_more_professional:
      "Viết lại nội dung theo giọng chuyên nghiệp hơn, vẫn tự nhiên và dễ gửi.",
    make_message_warmer:
      "Viết lại nội dung theo giọng ấm áp và gần gũi hơn, không quá dài.",
    personalize_template:
      "Cá nhân hóa template theo lead hoặc tình huống. Giữ ý chính, thay phần chung chung thành nội dung cụ thể khi dữ liệu cho phép.",
    rewrite_message:
      "Viết lại nội dung sao cho rõ ý, lịch sự và dễ gửi hơn.",
    shorten_message:
      "Rút gọn nội dung, giữ ý chính, ưu tiên câu ngắn và dễ copy.",
    suggest_next_step:
      "Gợi ý 3 bước tiếp theo nên làm với lead này. Mỗi bước gồm lý do ngắn.",
    summarize_notes:
      "Tóm tắt lịch sử ghi chú của lead thành các ý chính, chỉ dùng dữ liệu được cung cấp.",
    write_email:
      "Viết email giới thiệu hoặc follow-up phù hợp với lead. Có tiêu đề email và nội dung email.",
    write_follow_up:
      "Viết nội dung follow-up sau báo giá, sau cuộc gọi hoặc sau lần trao đổi gần nhất.",
    write_zalo_message:
      "Viết tin nhắn Zalo ngắn gọn, lịch sự, tự nhiên để gửi cho lead.",
  };

  const userPrompt = [
    taskMap[requestType] || "Tạo nội dung hỗ trợ sale.",
    "",
    leadContext,
    templateContext,
    shared ? `Yêu cầu của user:\n${shared}` : "",
    "",
    "Chỉ trả về nội dung user có thể dùng. Không thêm phân tích dài dòng.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    systemPrompt: SALES_AI_SYSTEM_PROMPT,
    userPrompt,
  };
}
