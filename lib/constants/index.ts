export const navigationLinks = [
  { label: "Tính năng", href: "/#tinh-nang" },
  { label: "Cách hoạt động", href: "/#cach-hoat-dong" },
  { label: "Ai phù hợp", href: "/#ai-phu-hop" },
  { label: "FAQ", href: "/#faq" },
] as const;

export const painPoints = [
  {
    title: "Tìm khách thủ công mất quá nhiều thời gian",
    description:
      "Mỗi lần mở bản đồ, Google, Zalo hay danh bạ đều phải tự lọc lại từ đầu.",
  },
  {
    title: "Đi thị trường không có kế hoạch rõ ràng",
    description:
      "Tuyến hôm nay có thể bỏ sót nhiều điểm bán phù hợp chỉ vì không nhìn được theo khu vực.",
  },
  {
    title: "Lead cá nhân nằm rải rác khắp nơi",
    description:
      "Thông tin khách ở nhiều chỗ khác nhau nên rất khó xem lại trạng thái và ghi chú cũ.",
  },
  {
    title: "Quên follow-up làm mất cơ hội chốt",
    description:
      "Khách từng quan tâm nhưng không được gọi lại đúng ngày thì cơ hội dễ trôi qua.",
  },
] as const;

export const solutionCards = [
  {
    title: "Tìm khách theo khu vực",
    description:
      "Khoanh vùng địa bàn, xem nhanh nhóm khách phù hợp và lên danh sách ghé thăm.",
  },
  {
    title: "Tìm khách dọc tuyến đường",
    description:
      "Biến mỗi chuyến đi thị trường thành một tuyến có thêm cơ hội mới trên đường.",
  },
  {
    title: "Lưu lead cá nhân",
    description:
      "Lưu thông tin, tag, trạng thái và ghi chú theo cách đủ gọn cho một người dùng.",
  },
  {
    title: "Nhắc follow-up",
    description:
      "Đặt lịch chăm sóc tiếp theo để không bỏ lỡ khách đã từng quan tâm.",
  },
] as const;

export const featureCards = [
  "Tìm quanh tôi",
  "Tìm theo khu vực",
  "Tìm theo tuyến đường",
  "Lưu lead cá nhân",
  "Ghi chú tương tác",
  "Nhắc follow-up",
  "Thư viện mẫu sale",
  "Xuất dữ liệu",
] as const;

export const routeUseCases = [
  "Sale dược tìm nhà thuốc dọc tuyến hôm nay",
  "Sale FMCG tìm tạp hóa, quán ăn, điểm bán mới",
  "Sale vật liệu xây dựng tìm đại lý, cửa hàng, công trình",
  "Sale dịch vụ tìm doanh nghiệp, spa, phòng khám, showroom",
] as const;

export const leadStatuses = [
  "Mới lưu",
  "Đã liên hệ",
  "Quan tâm",
  "Hẹn lại",
  "Không phù hợp",
  "Đã chốt",
] as const;

export const audiences = [
  "Sale thị trường",
  "Sale B2B hunter",
  "Telesales / Inside sales",
  "Sale dịch vụ / freelancer",
  "Chủ kinh doanh tự đi bán",
] as const;

export const comparisonRows = [
  {
    tool: "Google Maps",
    description:
      "Tìm địa điểm tốt nhưng không quản lý lead, ghi chú tương tác hay follow-up.",
  },
  {
    tool: "Excel",
    description:
      "Linh hoạt nhưng khó dùng nhanh trên điện thoại khi đang đi thị trường.",
  },
  {
    tool: "CRM",
    description:
      "Mạnh cho đội nhóm nhưng thường nặng và dư tính năng với nhu cầu cá nhân.",
  },
  {
    tool: "SaleMap",
    description:
      "Tập trung cho cá nhân sale: tìm khách, lưu lead, ghi chú, follow-up.",
  },
] as const;

export const roleOptions = [
  "Sale thị trường",
  "Sale B2B",
  "Telesales / Inside sales",
  "Sale dịch vụ",
  "Sale freelancer",
  "Chủ kinh doanh tự đi bán",
  "Quản lý đội sale",
  "Khác",
] as const;

export const industryOptions = [
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
] as const;

export const desiredFeatureOptions = [
  "Tìm khách quanh tôi",
  "Tìm khách theo khu vực",
  "Tìm khách dọc tuyến đường",
  "Lưu lead cá nhân",
  "Ghi chú và phân loại khách",
  "Nhắc follow-up",
  "Mẫu tin nhắn/kịch bản sale",
  "Xuất Excel/CSV",
] as const;

export const readinessOptions = [
  "Có, tôi sẵn sàng dùng thử và góp ý",
  "Có, nhưng tôi cần xem sản phẩm trước",
  "Có thể, nếu không mất nhiều thời gian",
  "Chưa sẵn sàng",
] as const;

export const faqs = [
  {
    question: "Sản phẩm này có phải CRM không?",
    answer:
      "Không. SaleMap được thiết kế như công cụ cá nhân cho dân sale tự tìm khách, lưu lead và nhắc follow-up. Nó nhẹ hơn CRM doanh nghiệp và tập trung vào công việc hằng ngày của một người bán hàng.",
  },
  {
    question: "Tôi đã có CRM công ty rồi, có cần dùng thêm không?",
    answer:
      "Có thể có, nếu bạn vẫn cần một nơi riêng để lên tuyến đi thị trường, ghi chú nhanh và giữ nhắc việc cá nhân trước khi cập nhật dữ liệu chính thức lên CRM công ty.",
  },
  {
    question: "Tôi có dùng được trên điện thoại không?",
    answer:
      "Có. SaleMap được định hướng như một SaaS/PWA mobile-first, ưu tiên thao tác nhanh trên điện thoại khi bạn đang di chuyển.",
  },
  {
    question: "Tính năng tìm khách theo tuyến hoạt động như thế nào?",
    answer:
      "Ý tưởng là bạn chọn điểm đi, điểm đến hoặc tuyến dự kiến, sau đó SaleMap gợi ý nhóm khách phù hợp nằm gần tuyến để bạn không bỏ sót cơ hội trên đường.",
  },
  {
    question: "Tôi có thể xuất dữ liệu ra ngoài không?",
    answer:
      "Có định hướng hỗ trợ xuất dữ liệu như Excel/CSV để bạn không bị khóa dữ liệu trong một công cụ duy nhất.",
  },
  {
    question: "Dữ liệu lead của tôi có riêng tư không?",
    answer:
      "Quyền riêng tư dữ liệu lead là một nguyên tắc quan trọng của sản phẩm. SaleMap sẽ tiếp tục làm rõ cơ chế lưu trữ, quyền truy cập và xuất dữ liệu khi mở rộng người dùng.",
  },
  {
    question: "SaleMap có miễn phí không?",
    answer:
      "Có gói Free để bạn bắt đầu dùng thử các luồng chính trước khi cần nâng cấp.",
  },
  {
    question: "Sau này sản phẩm có tính phí không?",
    answer:
      "Có. SaleMap có thể mở thêm các gói trả phí cho nhu cầu tìm khách, AI, export và sử dụng nhiều hơn.",
  },
] as const;

export const footerLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Tính năng", href: "/#tinh-nang" },
  { label: "Đăng nhập", href: "/login" },
  { label: "Đăng ký", href: "/#dang-ky" },
  { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
  { label: "Điều khoản sử dụng", href: "/dieu-khoan-su-dung" },
  { label: "Liên hệ", href: "mailto:hello@salemap.vn" },
] as const;
