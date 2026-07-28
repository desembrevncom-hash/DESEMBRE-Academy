# DESEMBRE Academy - Production Launch Checklist

## 1. Environment Variables
- [ ] Kiểm tra `VITE_SUPABASE_URL` trỏ đúng vào dự án production.
- [ ] Kiểm tra `VITE_SUPABASE_ANON_KEY` là khoá anon đúng của production.
- [ ] Kiểm tra API Keys (ZNS, Zalo OA) trong Supabase Edge Functions / webhooks (nếu có).

## 2. Supabase / Database
- [ ] Xác nhận toàn bộ migration đã được chạy trên DB production (`supabase db push`).
- [ ] RLS (Row Level Security) được bật cho bảng `courses`, `course_batches`, `academy_instructors`, `course_registrations`.
- [ ] Kiểm tra Storage buckets (avatars, course covers) đã public và đúng quyền.

## 3. Data Cleanup
- [ ] Các khóa học "smoke", "test", "demo" đã được đổi `status` thành `archived` hoặc ẩn (Dùng tab Dữ liệu test).
- [ ] Các lớp "smoke", "test", "demo" đã được "Đóng đăng ký" hoặc "Chuyển nháp".
- [ ] Đảm bảo Course A (V4) hiển thị chuẩn chỉnh với đủ thông tin, ảnh cover, ngày khai giảng.

## 4. Public Routes & UI Test
- [ ] Trang chủ (`/`): Đã thay logo header chuẩn.
- [ ] Trang Lịch khai giảng (`/lich-khai-giang`): Chỉ hiển thị các lớp thật.
- [ ] Trang Khóa học chi tiết (`/khoa-hoc/:slug`): Hiển thị đầy đủ Instructor, Sessions, Lịch học.
- [ ] Favicon, Open Graph Title/Image đã hiển thị đúng khi chia sẻ link Zalo/Facebook.

## 5. Registration Flow (Critical)
- [ ] Thực hiện 1 đăng ký học thử bằng số điện thoại.
- [ ] Xác nhận form chặn nếu đăng ký trùng số điện thoại vào cùng 1 lớp.
- [ ] Xác nhận loading UI (drawer) không bị đóng đột ngột.
- [ ] Trả về thông báo thành công và màn hình Success UI hoạt động tốt.

## 6. CRM & ZNS Integration
- [ ] Dữ liệu đăng ký được đẩy vào bảng `course_registrations`.
- [ ] Trigger CRM tạo record bên bảng `crm_customers` hoặc `crm_leads` (nếu có hook).
- [ ] Outbox queue cho ZNS hoạt động ổn định và tin nhắn Zalo gửi về báo danh thành công (nếu cấu hình tự động).

## 7. Mobile QA
- [ ] Drawer "Đăng ký học" trên mobile mở full màn hình và cuộn mượt.
- [ ] Header Navigation trên mobile (Hamburger menu) hoạt động trơn tru.
- [ ] Không bị vỡ layout ở các thiết bị iOS/Android phổ biến.

## 8. Pre-launch Final Steps
- [ ] Clear cache Edge/CDN (nếu dùng Cloudflare/Vercel).
- [ ] Check Google Search Console để index trang mới.

---

### Rollback Notes (Nếu có sự cố)
- Nếu UI/UX có lỗi nghiêm trọng: Rollback về commit trước tại Vercel/Cloudflare (1-click revert).
- Nếu Database lỗi: Tắt public registration (sửa flag trên Frontend) và fix dữ liệu. Không rollback DB trừ khi hỏng toàn bộ (vì ảnh hưởng data user mới đăng ký).
