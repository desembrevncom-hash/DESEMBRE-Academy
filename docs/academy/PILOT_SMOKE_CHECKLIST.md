# PILOT SMOKE CHECKLIST

Sử dụng danh sách kiểm tra (checklist) này trước và trong quá trình chạy Pilot nội bộ để đảm bảo hệ thống không gặp sự cố nghiêm trọng (Blocker).

## 1. Xác thực & Phân quyền
- [ ] Đăng nhập thành công bằng Zalo OTP.
- [ ] Giao diện Homepage thay đổi linh hoạt tùy theo phiên đăng nhập (Đăng nhập -> Vào học viện).
- [ ] Học viên mới (chưa có Customer ID hợp lệ) được đưa vào màn hình `Pending Review` (Chờ duyệt).
- [ ] Đăng xuất và Đăng nhập lại thành công.

## 2. Quản trị học viên (Admin)
- [ ] Admin có thể vào trang quản lý và phê duyệt (Approve) học viên từ trạng thái Pending sang Active.
- [ ] Bảng điều khiển Admin không làm rò rỉ dữ liệu PII (Số điện thoại/Email phải được mã hóa nếu có cấu hình).

## 3. Trải nghiệm học viên (Dashboard & Profile)
- [ ] Bảng điều khiển (Dashboard) hiển thị đúng tổng số khóa học Đang học (Không đếm khóa bị chặn).
- [ ] "Khóa học của tôi" hiển thị mờ và hiện chữ "Đã bị khóa" cho những khóa bị Block.
- [ ] Cập nhật hồ sơ học viên thành công (Họ tên, Công ty, Email liên hệ, Chức vụ) mà không làm thay đổi Email xác thực cốt lõi và không gửi email rác.
- [ ] Số điện thoại trong hồ sơ được làm mờ an toàn (`+84••••8228`).

## 4. Quyền truy cập Khóa học (Course Access)
- [ ] Xem danh sách khóa học hiển thị chính xác trạng thái (Đang học, Khóa, Chưa cấp quyền).
- [ ] Có thể xem bài viết của Course A (Nếu có quyền).
- [ ] Có thể xem Video của Course B (Nếu có quyền).

## 5. Quản lý Overrides (Admin)
- [ ] Admin có thể **Grant** quyền truy cập thành công (Học viên vào xem được).
- [ ] Admin có thể **Revoke** lệnh Grant tạm thời (Học viên bị mất quyền nếu Tier không đủ).
- [ ] Admin có thể **Block** khóa học (Học viên bị cấm truy cập ngay lập tức).
- [ ] Admin có thể **Unblock** khóa học (Khôi phục quyền truy cập theo Tier).
- [ ] Khi bị Block, nếu học viên cố tình nhập URL trực tiếp vào bài học (Direct URL), hệ thống sẽ chủ động chặn và đẩy ra ngoài với thông báo lỗi.

## 6. Môi trường Sản xuất (Production)
- [ ] KHÔNG xuất hiện Diagnostic Panel (bảng gỡ lỗi) trong giao diện Production (Chỉ xuất hiện khi Dev chạy `VITE_SHOW_ACADEMY_DEBUG_PANEL=true`).
- [ ] KHÔNG có PII (Số điện thoại) lộ lọt trên thanh URL, Console.log trình duyệt hoặc hiển thị nguyên bản trên trang quản lý thông thường.
