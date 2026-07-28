# Cẩm nang Dọn dẹp Dữ liệu Test an toàn (TEST DATA CLEANUP GUIDE)

Tài liệu này hướng dẫn cách làm sạch dữ liệu rác/test được sinh ra trong quá trình phát triển Phase B mà không làm ảnh hưởng đến dữ liệu production hay phá vỡ cấu trúc database.

## 1. Nguyên tắc làm sạch
- **Cái gì ĐƯỢC PHÉP làm sạch (Safe to clean):** Các ghi đè quyền truy cập khóa học (overrides) được tạo ra với lý do chứa chữ "test", "smoke", "Phase C". Các enrollment giả lập bị lỗi.
- **Cái gì KHÔNG ĐƯỢC XÓA (Must not delete):** Bảng `auth.users`, cấu trúc khóa học (Course A, B), bảng khách hàng (customers), Tier, Partner Hub.
- **Phân biệt Cleanup và Migration:** Migration được dùng để thay đổi Schema và Structure (DDL). Cleanup chỉ thao tác lên Dữ liệu rác (Rows/DML) mang tính chất thủ công. Không nhúng lệnh DELETE dữ liệu vào thư mục `migrations`.
- **Luôn ưu tiên Revoke:** Thay vì `DELETE` thẳng vào database, hãy ưu tiên Expire/Revoke (Đặt status = 'revoked' hoặc expire_at) hoặc cập nhật thay vì xóa vật lý nếu bảng đó hỗ trợ Soft-Delete.

## 2. Cách nhận biết Dữ liệu Test
- Các bản ghi trong `academy_course_access_overrides` có cột `reason` chứa: `"test"`, `"smoke"`, `"REVOKE_COURSE_ACCESS"`, v.v.
- Các tài khoản học viên (student_accounts) không nối với bất kỳ Customer nào nhưng có tên mang tính chất Test (vd: "Test Account", "Dev User").

## 3. Các truy vấn kiểm kê (Inventory Queries)
Trước khi xóa bất cứ thứ gì, luôn chạy truy vấn `SELECT` để kiểm tra. Xem chi tiết tại tệp: `supabase/manual/academy_test_data_inventory.sql`.

Ví dụ:
```sql
SELECT * FROM public.academy_course_access_overrides 
WHERE reason ILIKE '%test%' OR reason ILIKE '%smoke%';
```

## 4. Các truy vấn dọn dẹp (Cleanup Queries)
Luôn đặt script DML dọn dẹp vào block `BEGIN` và `ROLLBACK` để test thử nghiệm, sau đó mới dùng `COMMIT`. Xem chi tiết tại tệp: `supabase/manual/academy_test_data_cleanup_safe.sql`.

Lưu ý: Giữ lại ít nhất 1-2 tài khoản Pilot test thực tế để phục vụ cho Internal Pilot.

## 5. Quy tắc liên quan (Don't touch list)
- Tuyệt đối không can thiệp bằng SQL vào các nghiệp vụ:
  - Email Campaign.
  - Zalo OTP (Bảng logs).
  - Partner Hub Sync.
  - `private.can_access_course` RPC.
  - Hàm Edge Function lấy link media.
