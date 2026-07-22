begin;

insert into cadence_templates (name, description, category, is_system, is_active, is_archived)
select name, description, category, true, true, false
from (
  values
    (
      'Chăm sóc lead mới',
      'Quy trình chăm sóc cơ bản cho lead mới vừa lưu từ Google Maps, import hoặc tạo thủ công.',
      'new_lead'
    ),
    (
      'Follow-up sau báo giá',
      'Quy trình nhắc và chăm sóc khách sau khi đã gửi báo giá.',
      'after_quote'
    ),
    (
      'Chăm sóc khách cũ',
      'Quy trình hỏi thăm, chăm sóc lại khách cũ hoặc khách từng mua.',
      'old_customer'
    ),
    (
      'Lead không phản hồi',
      'Quy trình chăm sóc lại các lead chưa nghe máy, chưa trả lời hoặc bị nguội.',
      'cold_lead'
    )
) as source(name, description, category)
where not exists (
  select 1
  from cadence_templates ct
  where ct.name = source.name
    and ct.is_system = true
);

insert into cadence_steps (
  cadence_template_id,
  step_order,
  day_offset,
  task_type,
  title,
  suggested_message,
  suggested_note,
  priority,
  suggested_lead_status,
  is_required
)
select
  ct.id,
  step.step_order,
  step.day_offset,
  step.task_type,
  step.title,
  step.suggested_message,
  step.suggested_note,
  step.priority,
  step.suggested_lead_status,
  true
from cadence_templates ct
join (
  values
    ('Chăm sóc lead mới', 1, 0, 'call', 'Gọi lần đầu', 'Chào anh/chị, em liên hệ để giới thiệu nhanh giải pháp phù hợp với cửa hàng của mình.', 'Gọi lần đầu để xác nhận nhu cầu và người phụ trách.', 'high', 'contacted'),
    ('Chăm sóc lead mới', 2, 1, 'zalo_message', 'Nhắn Zalo giới thiệu', 'Em gửi anh/chị thông tin ngắn để mình xem khi tiện. Nếu phù hợp em xin phép trao đổi thêm.', 'Gửi Zalo giới thiệu ngắn, tránh quá dài.', 'medium', 'follow_up'),
    ('Chăm sóc lead mới', 3, 3, 'follow_up', 'Follow-up lần 1', 'Em nhắn lại để xem anh/chị đã có thời gian xem thông tin chưa ạ.', 'Hỏi phản hồi sau lần giới thiệu đầu.', 'medium', 'interested'),
    ('Chăm sóc lead mới', 4, 7, 'follow_up', 'Follow-up lần 2', 'Em xin phép nhắc lại để xem bên mình còn nhu cầu trao đổi thêm không ạ.', 'Theo dõi lại sau một tuần.', 'medium', 'follow_up'),
    ('Chăm sóc lead mới', 5, 14, 'check_in', 'Kiểm tra lại mức độ quan tâm', 'Nếu thời điểm này chưa phù hợp, em xin phép lưu thông tin để liên hệ lại khi có chương trình tốt hơn.', 'Đánh giá lại mức độ quan tâm trước khi hạ ưu tiên.', 'low', 'not_fit'),

    ('Follow-up sau báo giá', 1, 0, 'quote', 'Gửi báo giá', 'Em gửi anh/chị báo giá theo nhu cầu mình vừa trao đổi. Anh/chị xem giúp em khi tiện nhé.', 'Gửi báo giá và xác nhận người nhận.', 'high', 'follow_up'),
    ('Follow-up sau báo giá', 2, 2, 'follow_up', 'Hỏi khách đã xem báo giá chưa', 'Em nhắn lại để xem anh/chị đã nhận và xem qua báo giá chưa ạ.', 'Hỏi phản hồi về báo giá.', 'high', 'follow_up'),
    ('Follow-up sau báo giá', 3, 5, 'zalo_message', 'Nhắc lại lợi ích chính', 'Điểm chính bên em có thể hỗ trợ là tiết kiệm thời gian và dễ theo dõi hiệu quả hơn.', 'Nhắc lại 1-2 lợi ích sát nhu cầu.', 'medium', 'interested'),
    ('Follow-up sau báo giá', 4, 7, 'call', 'Đề xuất lịch trao đổi', 'Em xin phép gọi nhanh để chốt các điểm còn vướng và đề xuất hướng triển khai phù hợp.', 'Đề xuất cuộc gọi hoặc lịch trao đổi ngắn.', 'medium', 'interested'),
    ('Follow-up sau báo giá', 5, 10, 'follow_up', 'Chốt lần cuối hoặc chuyển lead lạnh', 'Em xin phép hỏi lần cuối để biết mình còn ưu tiên nhu cầu này trong tháng này không ạ.', 'Chốt hướng xử lý tiếp theo.', 'medium', 'not_fit'),

    ('Chăm sóc khách cũ', 1, 0, 'check_in', 'Hỏi thăm tình hình', 'Em chào anh/chị, em hỏi thăm xem thời gian vừa rồi bên mình dùng sản phẩm/dịch vụ có ổn không ạ.', 'Hỏi thăm nhẹ, không bán ngay.', 'medium', 'follow_up'),
    ('Chăm sóc khách cũ', 2, 3, 'zalo_message', 'Gửi sản phẩm/dịch vụ mới', 'Bên em có cập nhật mới có thể phù hợp với bên mình, em gửi anh/chị xem nhanh nhé.', 'Gửi thông tin mới sát nhu cầu cũ.', 'medium', 'interested'),
    ('Chăm sóc khách cũ', 3, 7, 'call', 'Đề xuất ưu đãi hoặc lịch tư vấn', 'Em xin phép gọi nhanh để xem bên mình có cần tối ưu thêm hoặc nhận ưu đãi mới không ạ.', 'Gọi lại khi khách có tín hiệu quan tâm.', 'high', 'interested'),
    ('Chăm sóc khách cũ', 4, 14, 'follow_up', 'Follow-up lại nếu chưa phản hồi', 'Em nhắc lại thông tin trước đó, nếu chưa phù hợp em sẽ liên hệ lại vào dịp khác ạ.', 'Kết thúc nhịp chăm sóc nhẹ nhàng.', 'low', 'not_fit'),

    ('Lead không phản hồi', 1, 0, 'zalo_message', 'Nhắn lại nhẹ nhàng', 'Em chào anh/chị, em nhắn lại để không bỏ sót thông tin mình từng quan tâm.', 'Nhắn ngắn, lịch sự, không tạo áp lực.', 'medium', 'follow_up'),
    ('Lead không phản hồi', 2, 3, 'follow_up', 'Gửi thông tin ngắn gọn hơn', 'Em tóm tắt lại trong vài ý chính để anh/chị dễ xem khi bận.', 'Rút gọn nội dung trước đó.', 'medium', 'follow_up'),
    ('Lead không phản hồi', 3, 7, 'call', 'Hỏi thời điểm phù hợp để liên hệ', 'Em gọi để hỏi thời điểm nào tiện hơn cho anh/chị, tránh làm phiền lúc mình đang bận.', 'Xin thời điểm phù hợp để liên hệ.', 'medium', 'follow_up'),
    ('Lead không phản hồi', 4, 14, 'check_in', 'Tạm dừng chăm sóc nếu chưa phản hồi', 'Em xin phép tạm lưu thông tin và sẽ liên hệ lại khi có chương trình phù hợp hơn.', 'Tạm dừng nhịp chăm sóc nếu vẫn im lặng.', 'low', 'not_fit')
) as step(
  template_name,
  step_order,
  day_offset,
  task_type,
  title,
  suggested_message,
  suggested_note,
  priority,
  suggested_lead_status
)
  on ct.name = step.template_name
 and ct.is_system = true
where not exists (
  select 1
  from cadence_steps existing
  where existing.cadence_template_id = ct.id
    and existing.step_order = step.step_order
);

commit;
