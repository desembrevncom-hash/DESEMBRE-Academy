# Hợp Đồng Tích Hợp (Integration Contract)

## Quy Định Tích Hợp Supabase vào Academy

**Phân loại:** RECOMMENDATION
**Repository:** Desembre Academy
**File:** N/A
**Lines:** N/A
**Nội dung:**
Frontend Academy không tự duy trì Database, toàn bộ Auth và Data Query đều phải dùng Supabase Client thông qua các biến môi trường cấu hình tại Hub.

- Phải dùng chung project ID của Hub.
- Phải tuân thủ chuẩn gọi API thông qua `@supabase/supabase-js`.
- Bất kỳ lỗi cấu hình RLS nào đều do Backend (Hub repo) chịu trách nhiệm cấu hình trong `migrations`.
