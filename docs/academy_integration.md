# Kế Hoạch Tích Hợp Supabase Cho Desembre Academy

## 1. Hiện Trạng Frontend
- **Routing**: Sử dụng `@tanstack/react-router`.
- **Cây Route**: `/`, `/about`, `/courses`, `/courses/$slug`, `/student`, `/student/courses`, `/student/profile`, `/student/courses/$slug/lessons/$lessonId`, `/auth/phone`, `/auth/verify-otp`.
- **Mock Data**: Hiện tại các dữ liệu về khóa học, danh mục, giảng viên và học viên đều được hardcode tại thư mục `src/data/` (ví dụ: `courses.ts`). Hệ thống chưa có kết nối API thực tế.

## 2. Mục Tiêu Tích Hợp
Thay thế toàn bộ mock data tĩnh bằng dữ liệu thực tế từ hệ thống Supabase chung của toàn sinh thái DESEMBRE.

## 3. Kế Hoạch 4 PR (Pull Requests)
Việc tích hợp sẽ được chia nhỏ thành 4 giai đoạn nhằm đảm bảo tính ổn định:
- **PR 1 (Tại Hub Repo)**: Cập nhật Migration để thiết kế và khởi tạo Database Schema dành riêng cho Academy (bảng `courses`, `lessons`, `enrollments`, `student_progress`).
- **PR 2 (Tại Academy Repo)**: Cài đặt và cấu hình Supabase Client/Auth vào Academy, thiết lập luồng đăng nhập SSO, tái sử dụng session.
- **PR 3 (Tại Academy Repo)**: Refactor code, thay thế các mock data tại `src/data/` bằng các services gọi API thực tế tới Supabase.
- **PR 4 (Tại Hub Repo)**: Điều chỉnh và đồng bộ hóa cấu trúc Role cùng các chính sách bảo mật RLS giữa hai hệ thống.

## 4. Các Lưu Ý Kỹ Thuật
- Luồng Auth sẽ ưu tiên dùng số điện thoại (`phone`) theo định hướng chung của hệ sinh thái, tuy nhiên cần lưu ý rủi ro dữ liệu (không có unique constraint trên cột `phone` ở bảng `customers` hiện tại).
