# Checklist QA Sản Xuất Launch Landing Page SYNERGISTIC PROTOCOL

Tài liệu kiểm thử thủ công trước khi bắt đầu chạy chiến dịch quảng cáo (Ads) cho đường dẫn `/synergistic-protocol`.

---

## 1. Public Landing Page (`/synergistic-protocol`)
- [ ] **Giao diện Hero**: Hiển thị H1 "SYNERGISTIC PROTOCOL", 3 Value Pills, ảnh bìa khóa học (hoặc Gradient fallback) và 2 nút CTA chính/phụ.
- [ ] **Section Đối tượng học viên**: Hiển thị 4 thẻ nhóm đối tượng rõ ràng. Nút CTA cuối section hoạt động tốt.
- [ ] **Section Giá trị thực tiễn**: Hiển thị 6 kết quả đạt được. Nút CTA cuối section hoạt động tốt.
- [ ] **Section Nội dung đào tạo**:
  - Nếu đã tạo Buổi học trong Admin: Hiển thị đúng timeline buổi học thật.
  - Nếu chưa có Buổi học: Hiển thị giáo trình mẫu 4 buổi chuẩn hóa.
- [ ] **Section Cam kết chất lượng (Trust)**: Hiển thị 3 thẻ cam kết uy tín chuẩn Y Khoa Hàn Quốc.
- [ ] **Section Lớp khai giảng đang mở**: Render thẻ `TrainingScheduleCard` với đầy đủ thông tin ngày khai giảng, hình thức học, sĩ số và giảng viên.
- [ ] **Section FAQ**: Khối Accordion trả lời 5 câu hỏi phổ biến mở/gập mượt mà.

---

## 2. Mobile Experience (375px - 430px)
- [ ] Nút CTA cố định ở đáy màn hình (`PublicStickyCTA`) hoạt động mượt mà.
- [ ] Khi cuộn trang, thanh Sticky CTA không che khuất Form đăng ký (`RegistrationForm` drawer).
- [ ] Các nút hành động trong từng section được xếp chồng dọc (stack) full-width trên di động, không bị vỡ layout hoặc tạo thanh cuộn ngang.

---

## 3. Quy Trình Đăng Ký Học (`RegistrationForm` Drawer)
- [ ] Nhấp *"Đăng ký học"* hoặc *"Nhận tư vấn trước"* mở drawer đăng ký từ cạnh phải/dưới.
- [ ] Validate dữ liệu đầu vào:
  - Họ và tên (tối thiểu 2 ký tự).
  - Số điện thoại chuẩn định dạng Việt Nam (đầu 03, 05, 07, 08, 09).
- [ ] Gửi thông tin thành công hiển thị Modal `RegistrationSuccess` kèm thông tin lớp.
- [ ] Dữ liệu đăng ký ghi nhận đúng vào bảng `public.course_registrations`.

---

## 4. Kiểm Trả Đăng Ký Trùng (`Duplicate Guard`)
- [ ] Gửi lại form đăng ký cùng SĐT + Batch ID trong khoảng thời gian bảo vệ.
- [ ] Hệ thống nhận diện đúng trạng thái trùng lặp, mở Modal thành công với thông báo:
  > *"Bạn đã đăng ký lớp trước đó. DESEMBRE Academy sẽ liên hệ xác nhận..."*
- [ ] Không tạo bản ghi trùng lặp thừa trong CRM.

---

## 5. Đồng Bộ CRM & ZNS Notification Outbox
- [ ] Kiểm tra bảng `public.crm_leads`: Tự động cập nhật / tạo lead mới với nguồn kênh public.
- [ ] Kiểm tra bảng `public.notification_outbox`: Tự động tạo bản ghi ZNS chờ gửi xác nhận tới SĐT học viên.

---

## 6. Dữ Liệu Lớp Học Trong Admin (`/admin/batches`)
- [ ] Đã chạy file SQL Audit `scratch/p3c36d_synergistic_launch_qa.sql` trên Supabase SQL Editor.
- [ ] Đảm bảo Batch SYNERGISTIC PROTOCOL có trạng thái `registration_status = 'open'`.
- [ ] Đảm bảo thông tin ngày khai giảng (`start_date`) và hạn chót đăng ký (`registration_closes_at`) hợp lệ.

---

## 7. SEO & Xem Trước Chia Sẻ Social (Zalo / Facebook Preview)
- [ ] Thẻ `<title>` hiển thị: `SYNERGISTIC PROTOCOL | Khóa đào tạo protocol chuyên sâu | DESEMBRE Academy`.
- [ ] Thẻ `<meta name="description">` hiển thị mô tả ngắn đầy đủ.
- [ ] Thẻ `og:title` & `og:description` hoạt động chuẩn khi paste link trên Zalo / Facebook Chat.
