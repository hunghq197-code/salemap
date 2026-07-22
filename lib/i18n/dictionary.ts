export type Locale = "vi" | "en";

export const locales: Locale[] = ["vi", "en"];

export const dictionaries = {
  vi: {
    common: {
      beta: "Ra mắt",
      login: "Đăng nhập",
      registerBeta: "Đăng ký",
      registerFree: "Bắt đầu miễn phí →",
      saleMap: "SaleMap",
      viewHowItWorks: "Xem cách hoạt động",
    },
    auth: {
      loginDescription:
        "Đăng nhập để vào workspace SaleMap, lưu lead cá nhân và chuẩn bị các workflow follow-up hằng ngày.",
      loginEyebrow: "SaleMap app",
      loginTitle: "Đăng nhập vào SaleMap",
      registerDescription:
        "Tạo tài khoản để bắt đầu thiết lập khu vực bán hàng, mục tiêu sử dụng và workspace lead cá nhân.",
      registerEyebrow: "SaleMap",
      registerTitle: "Tạo tài khoản",
    },
    appShell: {
      bottomNav: [
        "Dashboard",
        "Pipeline",
        "Tìm khách",
        "Lead",
        "Việc",
        "Mẫu",
      ],
      desktopNav: [
        "Dashboard",
        "Pipeline bán hàng",
        "Tìm khách",
        "Lead cá nhân",
        "Hiệu suất",
        "Mục tiêu",
        "Góc nhìn lead",
        "Dọn dữ liệu lead",
        "Việc cần làm",
        "Thư viện mẫu",
        "Trợ lý AI",
        "Import dữ liệu",
        "Xuất dữ liệu",
        "Gói sử dụng",
        "Dữ liệu offline",
        "Cài đặt",
        "Hướng dẫn",
        "Góp ý",
      ],
      settings: "Cài đặt",
      workspace: "Workspace",
    },
    footer: {
      description:
        "Công cụ cá nhân cho dân sale tìm khách, lưu lead và chăm sóc cơ hội bán hàng tốt hơn.",
      links: [
        { href: "/", label: "Trang chủ" },
        { href: "/#tinh-nang", label: "Tính năng" },
        { href: "/login", label: "Đăng nhập" },
        { href: "/#dang-ky", label: "Đăng ký" },
        { href: "/chinh-sach-bao-mat", label: "Chính sách bảo mật" },
        { href: "/dieu-khoan-su-dung", label: "Điều khoản sử dụng" },
        { href: "mailto:hello@salemap.vn", label: "Liên hệ" },
      ],
    },
    landing: {
      audience: {
        eyebrow: "Ai phù hợp",
        items: [
          "Sale thị trường",
          "Sale B2B hunter",
          "Telesales / Inside sales",
          "Sale dịch vụ / freelancer",
          "Chủ kinh doanh tự đi bán",
        ],
        title:
          "Phù hợp với những người phải tự tìm khách và tự chăm sóc cơ hội bán hàng",
      },
      comparison: {
        badgeNo: "Thiếu bước",
        badgeYes: "Đúng luồng",
        eyebrow: "So sánh",
        flowHeader: "Tìm khách + lead + follow-up",
        fitHeader: "Phù hợp nhất",
        no: "Chưa đủ trọn luồng",
        rows: [
          {
            description:
              "Tìm địa điểm tốt nhưng không quản lý lead, ghi chú tương tác hay follow-up.",
            tool: "Google Maps",
          },
          {
            description:
              "Linh hoạt nhưng khó dùng nhanh trên điện thoại khi đang đi thị trường.",
            tool: "Excel",
          },
          {
            description:
              "Mạnh cho đội nhóm nhưng thường nặng và dư tính năng với nhu cầu cá nhân.",
            tool: "CRM",
          },
          {
            description:
              "Tập trung cho cá nhân sale: tìm khách, lưu lead, ghi chú, follow-up.",
            tool: "SaleMap",
          },
        ],
        title: "Khác gì so với Google Maps, Excel hay CRM?",
        toolHeader: "Công cụ",
        yes: "Tập trung đúng nhu cầu",
      },
      faq: {
        eyebrow: "FAQ",
        items: [
          {
            answer:
              "Không. SaleMap được thiết kế như công cụ cá nhân cho dân sale tự tìm khách, lưu lead và nhắc follow-up. Nó nhẹ hơn CRM doanh nghiệp và tập trung vào công việc hằng ngày của một người bán hàng.",
            question: "Sản phẩm này có phải CRM không?",
          },
          {
            answer:
              "Có thể có, nếu bạn vẫn cần một nơi riêng để lên tuyến đi thị trường, ghi chú nhanh và giữ nhắc việc cá nhân trước khi cập nhật dữ liệu chính thức lên CRM công ty.",
            question: "Tôi đã có CRM công ty rồi, có cần dùng thêm không?",
          },
          {
            answer:
              "Có. SaleMap được định hướng như một SaaS/PWA mobile-first, ưu tiên thao tác nhanh trên điện thoại khi bạn đang di chuyển.",
            question: "Tôi có dùng được trên điện thoại không?",
          },
          {
            answer:
              "Bạn chọn điểm đi, điểm đến hoặc tuyến dự kiến, sau đó SaleMap gợi ý nhóm khách phù hợp nằm gần tuyến để bạn không bỏ sót cơ hội trên đường.",
            question: "Tính năng tìm khách theo tuyến hoạt động như thế nào?",
          },
          {
            answer:
              "Có định hướng hỗ trợ xuất dữ liệu như Excel/CSV để bạn không bị khóa dữ liệu trong một công cụ duy nhất.",
            question: "Tôi có thể xuất dữ liệu ra ngoài không?",
          },
          {
            answer:
              "Quyền riêng tư dữ liệu lead là một nguyên tắc quan trọng của sản phẩm. SaleMap ưu tiên cơ chế lưu trữ, quyền truy cập và xuất dữ liệu rõ ràng để người dùng chủ động kiểm soát thông tin lead.",
            question: "Dữ liệu lead của tôi có riêng tư không?",
          },
        ],
        title: "Câu hỏi thường gặp",
      },
      features: {
        eyebrow: "Tính năng",
        items: [
          "Tìm quanh tôi",
          "Tìm theo khu vực",
          "Tìm theo tuyến đường",
          "Lưu lead cá nhân",
          "Ghi chú tương tác",
          "Nhắc follow-up",
          "Thư viện mẫu sale",
          "Xuất dữ liệu",
        ],
        title: "Những tính năng cần thiết nhất cho một người làm sale hằng ngày",
      },
      finalCta: {
        eyebrow: "SaleMap",
        title: "Sẵn sàng thử một cách làm sale gọn hơn?",
      },
      hero: {
        eyebrow: "Công cụ cho dân sale tự tìm khách",
        headline: "Tìm khách quanh bạn và trên tuyến đường chỉ trong vài phút",
        leadCards: [
          { area: "Cách 450m", name: "Nhà thuốc Minh An", status: "Quan tâm" },
          { area: "Gần tuyến hôm nay", name: "Tạp hóa Cô Lan", status: "Mới lưu" },
          { area: "Quận 7", name: "Showroom Hòa Phát", status: "Hẹn lại" },
        ],
        limit: "Còn 12 lượt tìm hôm nay",
        microcopy:
          "Không cần CRM phức tạp. Dùng tốt trên điện thoại cho sale thị trường, sale B2B và người tự kinh doanh.",
        mockupArea: "Tuyến Quận 7 hôm nay",
        mockupSuggestion: "Khách gợi ý",
        mockupUsage: "Hạn mức hôm nay",
        results: "24 khách phù hợp",
        saveLead: "Lưu lead",
        subheadline:
          "Công cụ cá nhân cho dân sale: tìm khách hàng tiềm năng theo khu vực, lưu lead, ghi chú sau mỗi lần liên hệ và nhắc follow-up đúng ngày.",
        todayFollowup: "Follow-up hôm nay",
      },
      how: {
        eyebrow: "Cách hoạt động",
        steps: [
          {
            description:
              "Tìm quanh vị trí hiện tại, theo khu vực mục tiêu hoặc dọc tuyến đường bạn sắp đi.",
            title: "Chọn cách tìm khách",
          },
          {
            description:
              "Chọn khách phù hợp, lưu thông tin chính và gắn tag để dễ lọc lại sau này.",
            title: "Lưu lead tiềm năng",
          },
          {
            description:
              "Ghi lại kết quả liên hệ, trạng thái lead và ngày cần follow-up tiếp theo.",
            title: "Ghi chú và đặt lịch chăm sóc",
          },
        ],
        title: "Từ tìm khách đến follow-up chỉ trong 3 bước",
      },
      leadFollowup: {
        cardLabel: "Lead cá nhân",
        eyebrow: "Lead và follow-up",
        note:
          "Chủ tiệm muốn xem bảng giá và chương trình tháng này.",
        noteLabel: "Ghi chú tương tác",
        reminder: "Gọi lại vào thứ Sáu, sau khi gửi báo giá.",
        reminderLabel: "Nhắc tiếp theo",
        statuses: [
          "Mới lưu",
          "Đã liên hệ",
          "Quan tâm",
          "Hẹn lại",
          "Không phù hợp",
          "Đã chốt",
        ],
        subtitle:
          "Mỗi lead được lưu lại như một hồ sơ nhỏ: thông tin cơ bản, trạng thái, tag, ghi chú, lịch sử tương tác và lịch nhắc tiếp theo. Bạn không cần dùng CRM phức tạp, nhưng vẫn có đủ dữ liệu để chăm sóc khách bài bản hơn.",
        tag: "Dược, Quận 7, cần báo giá",
        tagLabel: "Tag",
        title:
          "Tìm được khách mới chỉ là bước đầu. Quan trọng là bạn có chăm sóc lại đúng lúc không.",
      },
      loginStrip: {
        link: "Đăng nhập vào workspace",
        text: "Đã có tài khoản SaleMap?",
      },
      nav: [
        { href: "/#tinh-nang", label: "Tính năng" },
        { href: "/#cach-hoat-dong", label: "Cách hoạt động" },
        { href: "/#ai-phu-hop", label: "Ai phù hợp" },
        { href: "/#faq", label: "FAQ" },
      ],
      problem: {
        eyebrow: "Vấn đề",
        intro:
          "Một khách nằm trong Zalo, một khách nằm trong Excel, một khách lưu trong danh bạ. Đến lúc cần gọi lại thì không nhớ đã trao đổi gì.",
        points: [
          {
            description:
              "Mỗi lần mở bản đồ, Google, Zalo hay danh bạ đều phải tự lọc lại từ đầu.",
            title: "Tìm khách thủ công mất quá nhiều thời gian",
          },
          {
            description:
              "Tuyến hôm nay có thể bỏ sót nhiều điểm bán phù hợp chỉ vì không nhìn được theo khu vực.",
            title: "Đi thị trường không có kế hoạch rõ ràng",
          },
          {
            description:
              "Thông tin khách ở nhiều chỗ khác nhau nên rất khó xem lại trạng thái và ghi chú cũ.",
            title: "Lead cá nhân nằm rải rác khắp nơi",
          },
          {
            description:
              "Khách từng quan tâm nhưng không được gọi lại đúng ngày thì cơ hội dễ trôi qua.",
            title: "Quên follow-up làm mất cơ hội chốt",
          },
        ],
        title:
          "Dân sale thường không thiếu nỗ lực. Vấn đề là công cụ quá rời rạc.",
      },
      route: {
        cardTitle: "Gợi ý gần tuyến",
        eyebrow: "Tuyến đường",
        subtitle:
          "Với sale thị trường, mỗi tuyến đi là một cơ hội. Thay vì chỉ đi từ điểm A đến điểm B, bạn có thể tìm thêm các khách phù hợp nằm gần tuyến di chuyển.",
        tags: ["Nhà thuốc", "Tạp hóa", "Showroom"],
        title: "Đi một tuyến, đừng bỏ sót khách tiềm năng trên đường",
        useCases: [
          "Sale dược tìm nhà thuốc dọc tuyến hôm nay",
          "Sale FMCG tìm tạp hóa, quán ăn, điểm bán mới",
          "Sale vật liệu xây dựng tìm đại lý, cửa hàng, công trình",
          "Sale dịch vụ tìm doanh nghiệp, spa, phòng khám, showroom",
        ],
      },
      solution: {
        cards: [
          {
            description:
              "Khoanh vùng địa bàn, xem nhanh nhóm khách phù hợp và lên danh sách ghé thăm.",
            title: "Tìm khách theo khu vực",
          },
          {
            description:
              "Biến mỗi chuyến đi thị trường thành một tuyến có thêm cơ hội mới trên đường.",
            title: "Tìm khách dọc tuyến đường",
          },
          {
            description:
              "Lưu thông tin, tag, trạng thái và ghi chú theo cách đủ gọn cho một người dùng.",
            title: "Lưu lead cá nhân",
          },
          {
            description:
              "Đặt lịch chăm sóc tiếp theo để không bỏ lỡ khách đã từng quan tâm.",
            title: "Nhắc follow-up",
          },
        ],
        eyebrow: "Giải pháp",
        title: "Một nơi duy nhất để tìm khách, lưu lead và chăm sóc lại đúng lúc",
      },
    },
  },
  en: {
    common: {
      beta: "Launch",
      login: "Log in",
      registerBeta: "Sign up",
      registerFree: "Start free →",
      saleMap: "SaleMap",
      viewHowItWorks: "See how it works",
    },
    auth: {
      loginDescription:
        "Log in to your SaleMap workspace to manage personal leads, notes, reminders, and daily sales workflows.",
      loginEyebrow: "SaleMap app",
      loginTitle: "Log in to SaleMap",
      registerDescription:
        "Create an account to set up your sales territory, usage goals, and personal lead workspace.",
      registerEyebrow: "SaleMap",
      registerTitle: "Create an account",
    },
    appShell: {
      bottomNav: ["Dashboard", "Pipeline", "Find", "Leads", "Tasks", "Templates"],
      desktopNav: [
        "Dashboard",
        "Sales pipeline",
        "Find customers",
        "Personal leads",
        "Performance",
        "Goals",
        "Lead views",
        "Clean lead data",
        "Tasks",
        "Template library",
        "AI assistant",
        "Import data",
        "Export data",
        "Plan",
        "Offline data",
        "Settings",
        "Guide",
        "Feedback",
      ],
      settings: "Settings",
      workspace: "Workspace",
    },
    footer: {
      description:
        "A personal sales workspace to find customers, save leads, and follow up at the right time.",
      links: [
        { href: "/", label: "Home" },
        { href: "/#tinh-nang", label: "Features" },
        { href: "/login", label: "Log in" },
        { href: "/#dang-ky", label: "Sign up" },
        { href: "/chinh-sach-bao-mat", label: "Privacy policy" },
        { href: "/dieu-khoan-su-dung", label: "Terms" },
        { href: "mailto:hello@salemap.vn", label: "Contact" },
      ],
    },
    landing: {
      audience: {
        eyebrow: "Best for",
        items: [
          "Field sales reps",
          "B2B hunters",
          "Telesales / Inside sales",
          "Service sales / freelancers",
          "Founders who sell directly",
        ],
        title: "Built for people who find customers and follow up on their own",
      },
      comparison: {
        badgeNo: "Missing steps",
        badgeYes: "Full workflow",
        eyebrow: "Comparison",
        flowHeader: "Find + leads + follow-up",
        fitHeader: "Best fit",
        no: "Not the complete flow",
        rows: [
          {
            description:
              "Great for finding places, but not for managing leads, interaction notes, or follow-ups.",
            tool: "Google Maps",
          },
          {
            description:
              "Flexible, but slow and awkward on mobile while working in the field.",
            tool: "Excel",
          },
          {
            description:
              "Powerful for teams, but often too heavy for an individual seller's daily workflow.",
            tool: "CRM",
          },
          {
            description:
              "Focused on individual sellers: find customers, save leads, write notes, and follow up.",
            tool: "SaleMap",
          },
        ],
        title: "How is it different from Google Maps, Excel, or CRM?",
        toolHeader: "Tool",
        yes: "Focused on the right workflow",
      },
      faq: {
        eyebrow: "FAQ",
        items: [
          {
            answer:
              "No. SaleMap is designed as a personal sales tool for finding customers, saving leads, and following up. It is lighter than enterprise CRM and focused on one seller's daily workflow.",
            question: "Is SaleMap a CRM?",
          },
          {
            answer:
              "Possibly. SaleMap can be your personal layer for planning routes, taking quick notes, and keeping reminders before updating the official company CRM.",
            question: "I already use my company's CRM. Do I still need this?",
          },
          {
            answer:
              "Yes. SaleMap is mobile-first and PWA-friendly, so it is designed for quick actions while you are moving.",
            question: "Can I use it on my phone?",
          },
          {
            answer:
              "You choose a start, destination, or planned route. SaleMap suggests relevant customers near that route so you can add more opportunities to the trip.",
            question: "How does route-based discovery work?",
          },
          {
            answer:
              "Yes. SaleMap is designed to support CSV/Excel export so your data is not locked inside one tool.",
            question: "Can I export my data?",
          },
          {
            answer:
              "Lead privacy is a core principle. SaleMap keeps storage, access, and export controls clear so users can stay in control of their lead data.",
            question: "Is my lead data private?",
          },
        ],
        title: "Frequently asked questions",
      },
      features: {
        eyebrow: "Features",
        items: [
          "Find nearby",
          "Area search",
          "Route search",
          "Personal leads",
          "Interaction notes",
          "Follow-up reminders",
          "Sales templates",
          "Data export",
        ],
        title: "The daily essentials for an individual sales workflow",
      },
      finalCta: {
        eyebrow: "SaleMap",
        title: "Ready for a cleaner way to sell?",
      },
      hero: {
        eyebrow: "For self-sourcing salespeople",
        headline: "Find customers around you or along your route in minutes",
        leadCards: [
          { area: "450m away", name: "Minh An Pharmacy", status: "Interested" },
          { area: "Near today's route", name: "Co Lan Grocery", status: "Saved" },
          { area: "District 7", name: "Hoa Phat Showroom", status: "Follow up" },
        ],
        limit: "12 searches left today",
        microcopy:
          "No complex CRM needed. Works well on mobile for field sales, B2B sellers, and solo business owners.",
        mockupArea: "District 7 route today",
        mockupSuggestion: "Suggested customers",
        mockupUsage: "Today’s quota",
        results: "24 matching customers",
        saveLead: "Save lead",
        subheadline:
          "A personal tool for salespeople: discover potential customers by area, save leads, write notes after each touchpoint, and follow up on time.",
        todayFollowup: "Follow-ups today",
      },
      how: {
        eyebrow: "How it works",
        steps: [
          {
            description:
              "Search near your current location, in a target area, or along the route you plan to visit.",
            title: "Choose how to find customers",
          },
          {
            description:
              "Pick relevant prospects, save key information, and tag them for easy filtering later.",
            title: "Save promising leads",
          },
          {
            description:
              "Record contact outcomes, update lead status, and schedule the next follow-up date.",
            title: "Take notes and set reminders",
          },
        ],
        title: "From discovery to follow-up in 3 steps",
      },
      leadFollowup: {
        cardLabel: "Personal lead",
        eyebrow: "Leads and follow-up",
        note: "The owner wants to review pricing and this month’s promotion.",
        noteLabel: "Interaction note",
        reminder: "Call back on Friday after sending the quote.",
        reminderLabel: "Next reminder",
        statuses: ["Saved", "Contacted", "Interested", "Follow up", "Not fit", "Won"],
        subtitle:
          "Each saved lead becomes a lightweight profile: core details, status, tags, notes, interaction history, and the next reminder. No heavy CRM required, but enough context to follow up professionally.",
        tag: "Pharma, District 7, needs pricing",
        tagLabel: "Tags",
        title:
          "Finding a new customer is only step one. The real win is following up at the right time.",
      },
      loginStrip: {
        link: "Log in to workspace",
        text: "Already have a SaleMap account?",
      },
      nav: [
        { href: "/#tinh-nang", label: "Features" },
        { href: "/#cach-hoat-dong", label: "How it works" },
        { href: "/#ai-phu-hop", label: "Best for" },
        { href: "/#faq", label: "FAQ" },
      ],
      problem: {
        eyebrow: "Problem",
        intro:
          "One customer is in Zalo, another in Excel, another in contacts. When it is time to call back, you cannot remember what was discussed.",
        points: [
          {
            description:
              "Every time you open maps, Google, Zalo, or contacts, you have to filter prospects again from scratch.",
            title: "Manual prospecting takes too much time",
          },
          {
            description:
              "A field route can miss relevant outlets simply because prospects are not visible by area.",
            title: "Field visits lack a clear plan",
          },
          {
            description:
              "Customer information lives in too many places, making status and old notes hard to review.",
            title: "Personal leads are scattered everywhere",
          },
          {
            description:
              "Interested customers drift away when they are not called back on the right day.",
            title: "Missed follow-ups lose deals",
          },
        ],
        title: "Salespeople are not short on effort. The tools are too scattered.",
      },
      route: {
        cardTitle: "Suggestions near route",
        eyebrow: "Route search",
        subtitle:
          "For field sales, every trip is an opportunity. Instead of only moving from A to B, discover relevant customers near the route.",
        tags: ["Pharmacy", "Grocery", "Showroom"],
        title: "Take one route, do not miss nearby opportunities",
        useCases: [
          "Pharma reps finding pharmacies along today's route",
          "FMCG reps finding groceries, eateries, and new outlets",
          "Construction material sellers finding dealers and stores",
          "Service sellers finding businesses, spas, clinics, and showrooms",
        ],
      },
      solution: {
        cards: [
          {
            description:
              "Define a territory, scan matching customer groups, and plan who to visit.",
            title: "Find customers by area",
          },
          {
            description:
              "Turn every field trip into a route with extra opportunities along the way.",
            title: "Find customers along a route",
          },
          {
            description:
              "Save details, tags, status, and notes in a lightweight personal workspace.",
            title: "Save personal leads",
          },
          {
            description:
              "Schedule the next touchpoint so interested customers do not slip away.",
            title: "Follow up on time",
          },
        ],
        eyebrow: "Solution",
        title: "One place to find customers, save leads, and follow up on time",
      },
    },
  },
} as const;
