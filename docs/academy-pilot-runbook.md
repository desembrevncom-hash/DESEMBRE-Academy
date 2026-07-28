# DESEMBRE Academy: Pilot Runbook & Final RC Checklist

## 1. Mục đích & Phạm vi Pilot
- Cung cấp MVP nội bộ để đánh giá trải nghiệm thực tế của luồng Học viên và quản trị Admin.
- Không phát triển thêm tính năng mới trong giai đoạn này, tập trung vào giám sát dữ liệu và cấp quyền.

## 2. Các vai trò (Pilot Roles)
- **Học viên Pilot (Pilot Students):** Dùng số điện thoại nội bộ hoặc số test để đăng nhập (Zalo OTP), thực hiện truy cập khóa học và cập nhật hồ sơ cá nhân.
- **Quản trị viên (Academy Admin):** Truy cập Partner Hub để phê duyệt tài khoản, cấp quyền (Grant) khóa học hoặc chặn (Block) khóa học đối với những Học viên Pilot.

## 3. Quản lý Tài khoản Test (Test Accounts)
- Khuyến nghị giữ lại tối thiểu 1-2 tài khoản test cố định để tiện đối chiếu lỗi phát sinh nếu có.
- Tránh giả lập thông tin rác vào hồ sơ thật, sử dụng lý do cấp quyền có tiền tố `[TEST]` hoặc `smoke` khi thao tác trong admin.

## 4. Các sự cố chấp nhận được (Known Acceptable Issues)
Trong bản RC hiện tại, các vấn đề sau đã được ghi nhận và **KHÔNG** coi là lỗi Blocker (có thể bỏ qua trong đợt Pilot):
- Thanh điều hướng (Navbar) của giao diện Admin có thể bị tràn hoặc xuống dòng khi xem ở thiết bị có chiều ngang hẹp (Narrow responsive width).
- Danh sách khóa học có thể vẫn hiển thị các khóa học đã hoàn thành nhưng hiện đang bị Block (Completed Blocked Courses) nếu như policy cho phép giữ lại lịch sử hoàn thành.

## 5. Quy trình Rollback (Rollback Notes)
Nếu phát hiện sự cố nghiêm trọng về bảo mật hoặc sai lệch dữ liệu diện rộng:
1. Thông báo nhóm Dev để khóa quyền truy cập Pilot (Vô hiệu hóa Vercel/Cloudflare preview url).
2. Xóa các quyền can thiệp (Overrides) sai lệch vừa tạo trong ngày bằng script `academy_test_data_cleanup_safe.sql`.
3. Khôi phục từ bản sao lưu Supabase gần nhất nếu cấu trúc dữ liệu bị phá hỏng nặng.

---

## 6. Final RC Smoke Checklist (Danh sách kiểm tra hằng ngày)
Trước khi bắt đầu Pilot hoặc sau mỗi đợt bảo trì, hãy chạy checklist sau:
- [ ] Zalo OTP đăng nhập thành công.
- [ ] Giao diện Homepage thay đổi linh hoạt tùy theo phiên đăng nhập (Khách / Học viên).
- [ ] Chuyển hướng màn hình Pending Review chính xác cho tài khoản chưa có Customer ID.
- [ ] Admin Approve thành công Học viên.
- [ ] Bảng điều khiển (Dashboard) không tính các khóa học bị khóa vào mục "Đang học".
- [ ] Nút "Tiếp tục học" chỉ chuyển tới khóa học khả dụng gần nhất (không bị khóa).
- [ ] Thẻ khóa học bị khóa hiện rõ chữ "Đã bị khóa" màu đỏ.
- [ ] Đọc bài viết (Course A) và Xem Video (Course B) hoạt động trơn tru.
- [ ] Admin thao tác Grant/Revoke/Block/Unblock thành công và phản hồi ngay lập tức về giao diện học viên.
- [ ] Truy cập đường dẫn tĩnh (Direct URL) vào bài học bị khóa sẽ tự động bị chặn.
- [ ] Cập nhật hồ sơ thành công (chỉ thay đổi metadata) và không làm lộ PII (`+84••••8228`).
- [ ] Đăng xuất và đăng nhập lại trơn tru.
- [ ] Các thông tin bảo mật PII trên URL/Console.log ở môi trường Pilot/Production được giấu kín.

---

## 7. Các đoạn Script Dọn dẹp Dữ liệu Test (SQL)
Các tệp script này đã được tạo tại thư mục `supabase/manual/`:

### A. Tệp `academy_test_data_inventory.sql` (Dùng để Xem/Preview trước khi xử lý)
Sử dụng `SELECT` kết hợp `ILIKE '%test%'` hoặc `ILIKE '%smoke%'` trên bảng `academy_course_access_overrides` để nhận diện các dòng cần dọn.

### B. Tệp `academy_test_data_cleanup_safe.sql` (Script Hủy quyền rác)
- **Tuyệt đối KHÔNG sử dụng `DELETE`** mặc định vào các bảng Khóa học (`courses`), Bài học (`lessons`), hoặc Nội dung/Storage.
- Sử dụng cú pháp `UPDATE ... SET expires_at = NOW()` theo các ID cụ thể hoặc mẫu (pattern) `reason ILIKE '%test%'`.
- Lệnh được bọc sẵn bằng `BEGIN;` và `ROLLBACK;`. Chỉ thay thế bằng `COMMIT;` khi bạn đã review toàn bộ kết quả.

## 8. Pilot Freeze Label
- **Nhãn phát hành:** Academy MVP Pilot RC-1
- **Ngày Freeze:** 2026-07-22
- **Supabase Project:** ynmcoeapfycijblydyuw
- **Scope:** Academy internal pilot
- **Status:** Ready for pilot

## 9. Cấu trúc Tài khoản Pilot (3-5 Tài khoản)
Ưu tiên sử dụng số điện thoại thật của team nội bộ:
- **1 Admin:** Có quyền Partner Hub để thực hiện cấp quyền.
- **2–4 Học viên (Active):** Đã qua bước review, sẵn sàng học.
- **1 Học viên Pending:** Để test màn hình pending-review.
- **1 Học viên Bị Khóa/Mở Khóa:** Để test UI trạng thái "Đã bị khóa".

## 10. Quy trình Test dành cho Học viên
1. Vào homepage
2. Đăng nhập bằng Zalo OTP
3. Nếu pending-review -> Nhờ Admin approve
4. Vào /student (Dashboard)
5. Vào /student/courses (Danh sách khóa)
6. Xem Course A article
7. Xem Course B video
8. Đánh dấu (Mark) tiến độ 50%
9. Đánh dấu (Mark) hoàn thành (completed)
10. Đăng xuất (Logout) và Đăng nhập (login) lại để kiểm tra trạng thái giữ nguyên.

## 11. Quy trình Test dành cho Admin
1. Admin xem danh sách Students
2. Admin xem Enrollments (Tiến độ học)
3. Admin cấp quyền (Grant allow) một course
4. Admin thu hồi quyền (Revoke allow)
5. Admin khóa (Block) Course B
6. Student thấy card hiển thị "Đã bị khóa"
7. Direct URL lesson bị chặn khi truy cập trực tiếp
8. Admin hủy khóa (Unblock)
9. Student truy cập xem video lại bình thường.

## 12. Query kiểm tra cuối mỗi ngày (Monitoring Queries)

**A. Thống kê số lượng quyền can thiệp (Overrides):**
``sql
select
  decision,
  access_scope,
  count(*) as total
from public.course_access_overrides
where starts_at <= now()
  and (expires_at is null or expires_at > now())
group by decision, access_scope
order by decision, access_scope;
``

**B. Thống kê trạng thái tài khoản học viên:**
``sql
select
  status,
  count(*) as total
from public.student_accounts
group by status
order by status;
``
