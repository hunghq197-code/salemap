-- SaleMap staging seed.
-- Run this only on the staging Supabase project.
-- No real customer data is inserted by this file.

insert into public.template_categories (name, slug, description, sort_order)
values
  ('Gọi điện', 'goi-dien', 'Kịch bản gọi mở đầu và khai thác nhu cầu.', 10),
  ('Tin nhắn Zalo', 'tin-nhan-zalo', 'Mẫu nhắn tin nhanh sau cuộc gọi hoặc khi chăm sóc lead.', 20),
  ('Email bán hàng', 'email-ban-hang', 'Mẫu email giới thiệu, gửi thông tin và follow-up.', 30),
  ('Follow-up', 'follow-up', 'Mẫu nhắc lại sau báo giá, demo hoặc tư vấn.', 40),
  ('Xử lý từ chối', 'xu-ly-tu-choi', 'Mẫu xử lý phản hồi thường gặp của khách.', 50),
  ('Hẹn lịch', 'hen-lich', 'Mẫu xin lịch trao đổi, demo hoặc gặp trực tiếp.', 60),
  ('Chăm sóc khách cũ', 'cham-soc-khach-cu', 'Mẫu hỏi thăm và kích hoạt lại khách cũ.', 70)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.templates (
  category_id,
  title,
  slug,
  description,
  content,
  template_type,
  situation,
  industry,
  channel,
  sort_order,
  is_public,
  is_active
)
values
  ((select id from public.template_categories where slug = 'goi-dien'), 'Mở đầu khách lạnh', 'staging-mo-dau-khach-lanh', 'Gọi lần đầu cho khách chưa biết bạn.', $$Em chào anh/chị [Tên khách], em là [Tên bạn] bên [Công ty]. Em gọi nhanh để xem bên mình có đang cần giải pháp về [sản phẩm/dịch vụ] không ạ.$$,'call_script','Mở đầu khách lạnh','general','phone',10,true,true),
  ((select id from public.template_categories where slug = 'goi-dien'), 'Gọi lại khách đã quan tâm', 'staging-goi-lai-khach-da-quan-tam', 'Gọi lại lead từng để lại thông tin.', $$Em chào anh/chị [Tên khách], trước đó anh/chị có quan tâm đến [sản phẩm/dịch vụ]. Em gọi lại để hỏi nhanh xem nhu cầu hiện tại còn phù hợp không ạ.$$,'call_script','Gọi lại lead ấm','general','phone',20,true,true),
  ((select id from public.template_categories where slug = 'goi-dien'), 'Khai thác nhu cầu ngắn', 'staging-khai-thac-nhu-cau-ngan', 'Câu hỏi ngắn để hiểu nhu cầu.', $$Để em tư vấn đúng hơn, anh/chị cho em hỏi: hiện tại bên mình đang xử lý [vấn đề] bằng cách nào, điểm khó nhất là gì và mình muốn cải thiện trong thời gian nào?$$,'call_script','Khai thác nhu cầu','general','phone',30,true,true),
  ((select id from public.template_categories where slug = 'goi-dien'), 'Chốt bước tiếp theo', 'staging-chot-buoc-tiep-theo', 'Kết thúc cuộc gọi rõ việc.', $$Em tóm tắt lại nhu cầu chính của mình là [nhu cầu]. Bước tiếp theo em sẽ [gửi thông tin/báo giá/hẹn demo] và follow-up lại vào [thời gian] nhé.$$,'call_script','Chốt bước tiếp theo','general','phone',40,true,true),

  ((select id from public.template_categories where slug = 'tin-nhan-zalo'), 'Zalo sau cuộc gọi', 'staging-zalo-sau-cuoc-goi', 'Gửi ngay sau khi vừa gọi xong.', $$Em chào anh/chị [Tên khách], em là [Tên bạn] vừa trao đổi với anh/chị qua điện thoại. Em gửi lại thông tin ngắn về [sản phẩm/dịch vụ] để anh/chị tiện xem lại ạ.$$,'zalo_message','Sau cuộc gọi','general','zalo',50,true,true),
  ((select id from public.template_categories where slug = 'tin-nhan-zalo'), 'Zalo khách chưa nghe máy', 'staging-zalo-khach-chua-nghe-may', 'Nhắn khi khách chưa tiện nghe máy.', $$Em chào anh/chị [Tên khách], em là [Tên bạn] bên [Công ty]. Khi nào tiện, anh/chị cho em xin 5 phút trao đổi thêm về [sản phẩm/dịch vụ] nhé.$$,'zalo_message','Khách chưa nghe máy','general','zalo',60,true,true),
  ((select id from public.template_categories where slug = 'tin-nhan-zalo'), 'Zalo nhắc xem tài liệu', 'staging-zalo-nhac-xem-tai-lieu', 'Nhắc nhẹ sau khi gửi tài liệu.', $$Em chào anh/chị [Tên khách], em xin phép hỏi anh/chị đã có thời gian xem qua thông tin em gửi chưa ạ? Nếu cần em có thể giải thích nhanh thêm.$$,'zalo_message','Nhắc xem tài liệu','general','zalo',70,true,true),
  ((select id from public.template_categories where slug = 'tin-nhan-zalo'), 'Zalo xác nhận lịch', 'staging-zalo-xac-nhan-lich', 'Xác nhận trước buổi hẹn.', $$Em xác nhận lại lịch trao đổi của mình vào [thời gian] về nội dung [nội dung]. Nếu cần đổi lịch, anh/chị nhắn em trước nhé.$$,'appointment','Xác nhận lịch','general','zalo',80,true,true),

  ((select id from public.template_categories where slug = 'email-ban-hang'), 'Email giới thiệu giải pháp', 'staging-email-gioi-thieu-giai-phap', 'Email đầu tiên gửi thông tin.', $$Tiêu đề: Gửi anh/chị thông tin về [sản phẩm/dịch vụ]

Em chào anh/chị [Tên khách],

Em gửi anh/chị thông tin ngắn về [sản phẩm/dịch vụ], giải pháp hỗ trợ [lợi ích chính]. Nếu phù hợp, em mong có thể trao đổi 10-15 phút để hiểu nhu cầu bên mình.$$,'email','Giới thiệu lần đầu','general','email',90,true,true),
  ((select id from public.template_categories where slug = 'email-ban-hang'), 'Email gửi tài liệu', 'staging-email-gui-tai-lieu', 'Gửi lại tài liệu sau tư vấn.', $$Tiêu đề: Tài liệu tham khảo về [sản phẩm/dịch vụ]

Em chào anh/chị [Tên khách],

Như nội dung mình vừa trao đổi, em gửi anh/chị tài liệu tóm tắt. Em sẽ follow-up lại vào [thời gian] để xem anh/chị có cần thêm thông tin không ạ.$$,'email','Sau tư vấn','general','email',100,true,true),
  ((select id from public.template_categories where slug = 'email-ban-hang'), 'Email mời demo', 'staging-email-moi-demo', 'Mời khách xem demo.', $$Tiêu đề: Mời anh/chị xem demo ngắn

Em nghĩ một buổi demo 20 phút sẽ giúp mình hình dung rõ hơn cách [sản phẩm/dịch vụ] hỗ trợ nhu cầu bên mình. Anh/chị tiện khung giờ nào trong tuần này ạ?$$,'appointment','Mời demo','general','email',110,true,true),
  ((select id from public.template_categories where slug = 'email-ban-hang'), 'Email tóm tắt sau demo', 'staging-email-tom-tat-sau-demo', 'Tóm tắt nhu cầu và bước tiếp.', $$Em cảm ơn anh/chị đã dành thời gian xem demo. Em tóm tắt lại: nhu cầu chính là [nhu cầu], điểm quan tâm là [điểm quan tâm], bước tiếp theo là [bước tiếp theo].$$,'email','Sau demo','general','email',120,true,true),

  ((select id from public.template_categories where slug = 'follow-up'), 'Follow-up sau báo giá', 'staging-follow-up-sau-bao-gia', 'Hỏi khách đã xem báo giá chưa.', $$Em chào anh/chị [Tên khách], em xin phép hỏi anh/chị đã xem qua báo giá em gửi hôm [ngày] chưa ạ? Có điểm nào cần em giải thích thêm không ạ?$$,'quote_follow_up','Sau báo giá','general','zalo',130,true,true),
  ((select id from public.template_categories where slug = 'follow-up'), 'Follow-up nhẹ sau 3 ngày', 'staging-follow-up-nhe-sau-3-ngay', 'Nhắc khi khách chưa phản hồi.', $$Em chào anh/chị [Tên khách], em nhắn lại để hỏi nhanh về nội dung [sản phẩm/dịch vụ] em gửi trước đó. Không biết bên mình còn quan tâm phần này không ạ?$$,'follow_up','Chưa phản hồi','general','zalo',140,true,true),
  ((select id from public.template_categories where slug = 'follow-up'), 'Follow-up sau demo', 'staging-follow-up-sau-demo', 'Hỏi cảm nhận sau demo.', $$Sau buổi demo hôm [ngày], không biết anh/chị thấy giải pháp có phù hợp với nhu cầu bên mình không ạ? Nếu còn điểm lăn tăn, em có thể giải thích kỹ hơn.$$,'follow_up','Sau demo','general','zalo',150,true,true),
  ((select id from public.template_categories where slug = 'follow-up'), 'Follow-up chờ duyệt nội bộ', 'staging-follow-up-cho-duyet-noi-bo', 'Nhắc khi khách cần hỏi sếp.', $$Em xin phép hỏi nội dung mình trao đổi hôm trước anh/chị đã tiện trao đổi lại với nội bộ chưa ạ? Nếu cần, em có thể gửi bản tóm tắt ngắn.$$,'follow_up','Chờ duyệt nội bộ','general','zalo',160,true,true),

  ((select id from public.template_categories where slug = 'xu-ly-tu-choi'), 'Phản hồi giá cao', 'staging-phan-hoi-gia-cao', 'Khi khách nói giá cao.', $$Dạ em hiểu ý anh/chị. Về giá, bên em tập trung vào [lợi ích chính] và [hỗ trợ]. Nếu tính theo hiệu quả sử dụng, phương án này thường tối ưu hơn về dài hạn.$$,'objection_handling','Giá cao','general','phone',170,true,true),
  ((select id from public.template_categories where slug = 'xu-ly-tu-choi'), 'Phản hồi chưa có nhu cầu', 'staging-phan-hoi-chua-co-nhu-cau', 'Giữ cơ hội khi khách chưa cần.', $$Dạ em hiểu, hiện tại mình chưa ưu tiên phần này. Anh/chị cho em hỏi thường khi nào bên mình sẽ xem xét lại nhu cầu [vấn đề] để em liên hệ đúng thời điểm ạ?$$,'objection_handling','Chưa có nhu cầu','general','phone',180,true,true),
  ((select id from public.template_categories where slug = 'xu-ly-tu-choi'), 'Phản hồi đang dùng bên khác', 'staging-phan-hoi-dang-dung-ben-khac', 'Khai thác cơ hội so sánh.', $$Dạ tốt quá ạ. Cho em hỏi giải pháp hiện tại có điểm nào anh/chị vẫn muốn cải thiện thêm không? Nếu có, em gửi một phương án so sánh ngắn để anh/chị tham khảo.$$,'objection_handling','Đang dùng bên khác','general','phone',190,true,true),
  ((select id from public.template_categories where slug = 'xu-ly-tu-choi'), 'Phản hồi gửi thông tin trước', 'staging-phan-hoi-gui-thong-tin-truoc', 'Biến yêu cầu gửi tài liệu thành bước tiếp.', $$Dạ được ạ. Để em gửi đúng thông tin, anh/chị quan tâm nhất phần nào: giá, tính năng, triển khai hay hiệu quả thực tế ạ?$$,'objection_handling','Gửi thông tin trước','general','phone',200,true,true),

  ((select id from public.template_categories where slug = 'hen-lich'), 'Hẹn lịch trao đổi lại', 'staging-hen-lich-trao-doi-lai', 'Xin 10-15 phút trao đổi sâu hơn.', $$Anh/chị có tiện cho em xin 10-15 phút vào [thời gian] để trao đổi kỹ hơn về nhu cầu bên mình không ạ? Nếu chưa tiện, em theo khung giờ phù hợp của anh/chị.$$,'appointment','Hẹn trao đổi','general','zalo',210,true,true),
  ((select id from public.template_categories where slug = 'hen-lich'), 'Hẹn demo sản phẩm', 'staging-hen-demo-san-pham', 'Đề xuất demo sau khi khách quan tâm.', $$Em thấy nhu cầu của bên mình khá phù hợp để xem demo nhanh. Anh/chị có tiện 20 phút vào [thời gian] để em demo đúng phần mình quan tâm không ạ?$$,'appointment','Hẹn demo','general','zalo',220,true,true),

  ((select id from public.template_categories where slug = 'cham-soc-khach-cu'), 'Hỏi thăm khách cũ', 'staging-hoi-tham-khach-cu', 'Kích hoạt lại khách cũ tự nhiên.', $$Em chào anh/chị [Tên khách], lâu rồi em chưa có dịp hỏi thăm mình. Không biết thời gian gần đây bên mình sử dụng [sản phẩm/dịch vụ] có ổn không ạ?$$,'follow_up','Hỏi thăm khách cũ','general','zalo',230,true,true),
  ((select id from public.template_categories where slug = 'cham-soc-khach-cu'), 'Xin feedback khách cũ', 'staging-xin-feedback-khach-cu', 'Hỏi cảm nhận để cải thiện.', $$Em muốn hỏi nhanh cảm nhận của anh/chị sau thời gian sử dụng [sản phẩm/dịch vụ]. Có điểm nào bên em đang làm tốt hoặc cần cải thiện thêm không ạ?$$,'follow_up','Xin feedback','general','zalo',240,true,true)
on conflict (slug) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  content = excluded.content,
  template_type = excluded.template_type,
  situation = excluded.situation,
  industry = excluded.industry,
  channel = excluded.channel,
  sort_order = excluded.sort_order,
  is_public = true,
  is_active = true,
  updated_at = now();

insert into public.feature_flags (
  flag_key,
  name,
  description,
  is_enabled,
  rollout_percentage
)
values
  ('map_discovery', 'Map discovery', 'Tìm khách quanh tôi và theo khu vực.', true, 100),
  ('route_search', 'Route search', 'Tìm khách dọc tuyến đường.', true, 100),
  ('export_csv', 'Export CSV', 'Xuất danh sách lead ra CSV.', true, 100),
  ('template_library', 'Template library', 'Thư viện mẫu gọi điện, Zalo, email và follow-up.', true, 100),
  ('email_notifications', 'Email notifications', 'Email nhắc follow-up và digest hằng ngày.', false, 0),
  ('upgrade_interest', 'Upgrade interest', 'CTA ghi nhận quan tâm nâng cấp gói.', true, 100),
  ('beta_survey', 'User survey', 'Khảo sát trong app cho người dùng.', true, 100),
  ('ai_assistant', 'AI assistant', 'Trợ lý AI viết tin nhắn và tóm tắt ghi chú.', false, 0),
  ('sample_data', 'Sample data', 'Tạo dữ liệu mẫu cho tài khoản mới.', true, 100),
  ('payment_gateway', 'Payment gateway', 'Thanh toán tự động qua payOS.', false, 0),
  ('import_leads', 'Import leads', 'Import CSV/XLSX.', true, 100),
  ('offline_pwa', 'Offline PWA', 'Offline-lite và install PWA.', true, 100),
  ('cleanup_tools', 'Cleanup tools', 'Dọn dữ liệu lead, duplicate và bulk actions.', true, 100),
  ('pipeline', 'Pipeline', 'Pipeline bán hàng và saved views.', true, 100),
  ('analytics', 'Analytics', 'Analytics và sales goals.', true, 100)
on conflict (flag_key) do update
set
  name = excluded.name,
  description = excluded.description,
  is_enabled = excluded.is_enabled,
  rollout_percentage = excluded.rollout_percentage,
  updated_at = now();

-- Optional user-owned sample tags.
-- In Supabase SQL Editor, replace the UUID below before running this block:
-- select set_config('salemap.seed_user_id', '00000000-0000-0000-0000-000000000000', false);
do $$
declare
  seed_user_id uuid := nullif(current_setting('salemap.seed_user_id', true), '')::uuid;
begin
  if seed_user_id is null then
    raise notice 'Skipping sample tags. Set salemap.seed_user_id to a staging auth user id to seed user tags.';
    return;
  end if;

  insert into public.tags (user_id, name, color)
  values
    (seed_user_id, 'Tiềm năng', '#22c55e'),
    (seed_user_id, 'Cần gọi lại', '#f59e0b'),
    (seed_user_id, 'Khách cũ', '#6366f1'),
    (seed_user_id, 'Quận 1', '#0ea5e9'),
    (seed_user_id, 'Đã báo giá', '#ef4444')
  on conflict (user_id, name) do update
  set
    color = excluded.color,
    updated_at = now();
end $$;

-- System smart views are ensured by the app when a user opens lead views/pipeline.
