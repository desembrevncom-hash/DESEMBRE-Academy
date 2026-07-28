# Cẩm nang Chạy thử nội bộ (Internal Pilot Runbook) - DESEMBRE Academy

## Mục đích của Pilot
Chương trình Pilot nội bộ nhằm mục đích kiểm tra và xác nhận các tính năng MVP của DESEMBRE Academy trong một môi trường được kiểm soát chặt chẽ với một nhóm người dùng hạn chế trước khi triển khai rộng rãi cho khách hàng và đối tác.

## Phạm vi Pilot (Scope)
- **Hệ thống xác thực:** Đăng nhập qua Zalo OTP (ẩn danh số điện thoại trên giao diện).
- **Hồ sơ học viên:** Cập nhật thông tin cá nhân (không thay đổi Email xác thực cốt lõi).
- **Dashboard Học viên:** Thống kê số lượng khóa học, tiếp tục học khóa gần nhất.
- **Trải nghiệm Học tập:** Xem danh sách khóa học, truy cập bài học bài viết (Course A) và video (Course B).
- **Kiểm soát truy cập (Admin):** Quản lý phê duyệt học viên mới, cấp quyền (Grant), thu hồi (Revoke), chặn (Block), và bỏ chặn (Unblock) khóa học.

## Đối tượng tham gia (Who can join)
- Nhân viên nội bộ DESEMBRE.
- Một số đối tác được chọn lọc trước (có số điện thoại nằm trong danh sách White-list hoặc được Admin duyệt).

## Vai trò Admin
- **Academy Admin:** Có quyền xem danh sách học viên, duyệt trạng thái từ Pending Review sang Active, theo dõi tiến độ và can thiệp thủ công vào quyền truy cập khóa học của học viên.

## Luồng người dùng (Student Flow)
1. Truy cập trang chủ, nhấn "Đăng nhập".
2. Nhập số điện thoại, nhận và xác thực OTP qua Zalo.
3. Nếu là lần đầu: Chuyển đến trang Pending Review (chờ duyệt).
4. Nếu đã được duyệt (Active): Chuyển đến Bảng điều khiển (Dashboard).
5. Khám phá danh sách khóa học -> Nhấp vào khóa học khả dụng -> Học bài.

## Luồng quản trị (Admin Flow)
1. Đăng nhập với tài khoản có quyền Admin.
2. Truy cập Partner Hub Admin -> Academy.
3. Chuyển sang Tab Học viên (Students).
4. Phê duyệt (Approve) học viên đang ở trạng thái Pending.
5. Xem chi tiết học viên, chọn khóa học cụ thể để Grant (cấp quyền) hoặc Block (chặn).

## Quy tắc truy cập khóa học (Course Access Rules)
Quyền truy cập của học viên được ưu tiên đánh giá theo thứ tự:
1. **Block thủ công:** Bị chặn bởi Admin -> Không thể học.
2. **Grant thủ công:** Được Admin cấp quyền đặc biệt -> Được học.
3. **Quyền mặc định:** Dựa theo Hạng (Tier) của khách hàng được liên kết.

## Ý nghĩa các hành động can thiệp quyền (Grant / Revoke / Block / Unblock)
- **Grant (Cấp quyền):** Cấp quyền truy cập thủ công cho một khóa học mà học viên bình thường không có (do không đủ Tier).
- **Revoke (Thu hồi):** Hủy bỏ lệnh Grant trước đó. Hệ thống sẽ quay về kiểm tra quyền theo Tier mặc định.
- **Block (Chặn):** Chặn hoàn toàn quyền truy cập của học viên vào một khóa học (kể cả khi Tier của họ đủ điều kiện).
- **Unblock (Bỏ chặn):** Hủy bỏ lệnh Block. Hệ thống sẽ quay về đánh giá quyền theo Tier mặc định hoặc Grant.

## Các giới hạn đã biết (Known Limitations)
- Thông tin PII (Số điện thoại) bị ẩn toàn bộ trên giao diện bằng dấu `*`. Admin không thể sửa số điện thoại của học viên.
- Form cập nhật hồ sơ chỉ thay đổi `user_metadata` để hiển thị, không tác động đến Core Auth Identity (nhằm tránh kích hoạt quy trình gửi Email Confirmation mặc định của Supabase).
- Không có bảng điều khiển Diagnostic (Debug) trừ khi ở môi trường Local / Dev.

## Quy trình hỗ trợ và leo thang (Support / Escalation)
- Mọi lỗi liên quan đến xác thực Zalo OTP cần được báo cáo trực tiếp cho nhóm IT/Dev để kiểm tra log Zalo ZCA.
- Các lỗi hiển thị khóa học không đúng quyền cần được lưu lại Access Reason trên màn hình học viên để đối chiếu.
- Liên hệ Dev/Admin cấp cao nếu xảy ra sự cố sập luồng (Blocking bugs).

## Các bước Rollback (Rollback Steps)
- Nếu lỗi UI/UX nghiêm trọng: Revert code trên nhánh main và redeploy nền tảng Web.
- Nếu lỗi dữ liệu truy cập sai diện rộng: Chạy Script xóa/revoke toàn bộ `academy_course_access_overrides` vừa tạo trong ngày Pilot. Đảm bảo dữ liệu Tier không bị ảnh hưởng.
