# DESEMBRE Academy - Launch QA Checklist

## 1. Môi trường & Cấu hình (Environment & Config)
- [x] Web VITE_SUPABASE_URL & ANON_KEY đã trỏ đúng DB Production.
- [x] DB Schema & Migration trên Supabase đã đồng bộ (RLS, constraints, RPCs).
- [x] Storage Buckets (avatars, course covers) được public thành công.

## 2. Public Routes QA
- [x] **Trang chủ (`/`)**: Brand Assets (Favicon, Logo, Navigation bar) hiển thị mượt mà.
- [x] **Lịch khai giảng (`/lich-khai-giang`)**: Lọc dữ liệu lớp học chính xác, ẩn toàn bộ lớp test/demo.
- [x] **Trang Khóa học (`/khoa-hoc/:slug`)**: Hiển thị đầy đủ thông tin khóa học, danh sách lớp sắp khai giảng, thông tin chuyên gia đào tạo. Lớp demo trả về Empty State.
- [x] **Trang Giảng viên (`/giang-vien/:slug`)**: Hiển thị ảnh đại diện, danh hiệu, kinh nghiệm và danh sách khóa/lớp học phụ trách.

## 3. Admin Routes QA
- [x] **Quản lý Khóa học (`/admin/courses`)**: Lọc tab hoạt động / lưu trữ / dữ liệu test. Thao tác lưu trữ dữ liệu test an toàn. Nút "+ Tạo lớp" nhảy đúng link prefill `course_id`.
- [x] **Quản lý Lớp học (`/admin/batches`)**: Đơn giản hóa trạng thái, lọc dữ liệu demo. Đóng đăng ký nhanh cho lớp test.
- [x] **Lịch Đào tạo (`/admin/calendar`)**: Hiển thị lịch khai giảng dưới dạng timeline/lịch trực quan.
- [x] **Quản lý Giảng viên (`/admin/instructors`)**: Thêm/Sửa ảnh avatar chuyên gia, gán thông tin sinh động.
- [x] **CRM & Đăng ký (`/admin/academy-enrollments`)**: Quản lý Leads, phân công tư vấn viên, xác nhận đăng ký học viên.

## 4. Kiểm tra luồng Đăng ký & Thông báo (End-to-End Registration & Notification Flow)
- [x] **Public Form Registration**:
  - Người dùng gửi form trên mobile/desktop ➔ Lưu bản ghi `course_registrations` (status: `pending`).
  - Hàng chờ `notification_outbox` nhận event đăng ký mới (message_type: `registration_created`).
  - Chống đăng ký trùng lặp số điện thoại trên cùng một lớp học.
- [x] **CRM Confirmation**:
  - Admin bấm "Xác nhận đăng ký" ➔ Trạng thái chuyển thành `confirmed`.
  - Hàng chờ `notification_outbox` nhận event `registration_confirmed` để gửi ZNS qua Zalo OA.

## 5. UI/UX & Mobile QA
- [x] Tất cả nhãn, thông báo toast, modal, nút bấm chính đã được Việt hóa hoàn toàn.
- [x] Mobile Responsive: Header Hamburger menu, Drawer đăng ký full-screen cuộn mượt, không bị tràn ngang (overflow-x).

## 6. Kết quả Kiểm thử Tự động (Automated Tests Verification)
- [x] `npx tsc --noEmit`: 0 Lỗi TypeScript.
- [x] `npm run build`: Build Nitro / Vite thành công, sẵn sàng deploy.
