# P3C.30 Production Readiness & Launch Checklist
**Status:** Audit Completed
**Date:** 2026-07-28

---

## 1. Environment Audit ✅
- [x] **Supabase URL & Anon Key**: Đã cấu hình trên frontend public (dùng cho VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY).
- [x] **Service Role Key**: Đã cập nhật vào `.env.example` với ghi chú rõ ràng KHÔNG BAO GIỜ leak cho frontend/client. Chỉ dùng cho backend/worker.
- [x] **Site URL**: Đã thêm `VITE_SITE_URL` để sinh absolute URL cho SEO/chia sẻ.
- [x] **ZNS/Hub Env**: `HUB_API_URL` và `HUB_WORKER_SECRET` đã được ghi nhận đầy đủ.
- [x] **Secret logging**: Xác nhận code frontend và RPC không in secret/token ra console, không expose SQL error raw qua RPC.

## 2. Supabase / Database Audit ✅
- [x] **Audit Script**: Đã tạo file `scratch/p3c30_supabase_audit.sql` để kiểm tra nhanh trên production.
- [x] **Tables**: Các bảng lõi (`courses`, `course_batches`, `course_registrations`, `notification_outbox`, `academy_instructors`, v.v.) đã sẵn sàng.
- [x] **RPCs**:
  - Public flow (`public_submit_course_registration`, `public_get_training_schedule`...) hoạt động.
  - Admin CRM flow (`admin_get_all_course_registrations`, `admin_update_course_registration_status`...) hoạt động.
- [x] **Permissions**: Public có quyền `GRANT EXECUTE` trên các `public_` RPCs.

## 3. Security Review ✅
- [x] **Public Route Data Leak**: `public_get_training_schedule` và `public_get_course_detail` chỉ join/trả về các field cần thiết. Không expose `internal_note` hay dữ liệu nhạy cảm.
- [x] **Admin Authentication**: Admin routes được bọc bởi `AdminGuard` và kiểm tra qua hook `useAdminAccess`.
- [x] **Registration Guard**: Duplicate phone/batch guard đã được test và chặn submit rác thành công.
- [x] **CRM RPC Access**: Đã được bọc `SECURITY DEFINER` và có check `is_admin_or_sub_admin(auth.uid())` cứng ở DB layer.

## 4. ZNS / Outbox Production Check ✅
- [x] **Templates**: ZNS ID 1 (registration_received) và ZNS ID 2 (registration_confirmed) đã được real-send thành công.
- [x] **Credentials**: Zalo OA token đang hoạt động tốt trên ZNS Hub.
- [x] **Cron job**: ZNS Outbox worker cron chạy liên tục/đúng lịch.
- [x] **Error Handling**: Các notification lỗi ghi nhận được `error_message` rõ ràng (VD: SĐT không dùng Zalo). Trạng thái retry an toàn.

## 5. SEO & Public Meta Check ✅
- [x] **/lich-khai-giang**: Title, h1 rõ ràng. Responsive tốt trên mobile. CTA nổi bật.
- [x] **/khoa-hoc/:slug**: Có đầy đủ outline, overview, CTA "Đăng ký ngay". Form đăng ký bung đúng lớp.
- [x] **/giang-vien/:slug**: Có bio, lịch dạy, CTA liên hệ. Fallback avatar hoàn thiện.
- [x] *Ghi chú SEO*: TanStack Router hiện đang dùng title cơ bản. Nếu cần SEO sâu hơn (Open Graph, Meta Image) cần update `meta` exports trên production server. Tạm thời đủ dùng để launch.

## 6. UX Final Smoke Test Checklist ⏳
*(Chạy manual test trước khi cho khách public)*

**Public:**
- [ ] Vào `/lich-khai-giang`, cuộn mượt trên mobile.
- [ ] Click nút "Đăng ký" → Mở Drawer.
- [ ] Nhập SĐT, Tên đầy đủ → Submit thành công → Hiện Success Modal.
- [ ] Nhập lại SĐT đó + Cùng lớp → Báo lỗi Duplicate.
- [ ] Mở trang `/khoa-hoc/foo` → Xem chi tiết mượt mà.

**Admin:**
- [ ] Đăng nhập tài khoản Admin/Sub-Admin.
- [ ] Vào `/admin/academy-enrollments`.
- [ ] Xem danh sách lead mới vừa tạo ở trên. Mở chi tiết.
- [ ] Cập nhật trạng thái thành "Đã liên hệ". Thêm nội dung "Chăm sóc lead".
- [ ] Đổi trạng thái thành "Đã xác nhận (Confirmed)".
- [ ] Đợi 2-3 phút, kiểm tra điện thoại khách xem ZNS có về không (hoặc check `/admin/notifications`).

## 7. Deployment Readiness 🚀
- **Build Tool**: Vite / TanStack Start
- **Build Command**: `npm run build`
- **Output**: Thư mục `.output` (Nitro server prebuilt).
- **Start Command**: `node .output/server/index.mjs`
- **Hosting**: Cloudflare Pages / Vercel / Node VPS tuỳ cấu hình Nitro.
- **Rollback**: Rollback thông qua Git tag hoặc rollback Supabase schema nếu có migration lỗi. Không xoá data trực tiếp.

### 📝 Kết quả Audit: PASS ✅
Dự án đã đủ điều kiện Launch (Public Beta).
