# Mapping Cấu Trúc: Mock to Supabase

**Phân loại:** RECOMMENDATION
**Repository:** Desembre Academy
**File:** `src/data/courses.ts`
**Lines:** 1-169
**Nội dung:** Bảng dưới đây thể hiện lộ trình thay thế mock data.

| Frontend feature   | Current route              | Current component | Current mock file     | Current service  | Supabase table/function đề xuất | Required RLS        | PR dự kiến |
| ------------------ | -------------------------- | ----------------- | --------------------- | ---------------- | ------------------------------- | ------------------- | ---------- |
| Danh sách khóa học | `/courses`                 | `Courses`         | `src/data/courses.ts` | Trực tiếp import | Bảng `academy_courses`          | Public select       | PR 3       |
| Chi tiết khóa học  | `/courses/$slug`           | `CourseDetail`    | `src/data/courses.ts` | Trực tiếp import | Bảng `academy_courses`          | Public select       | PR 3       |
| Tiến độ học viên   | `/student/courses`         | `StudentCourses`  | `src/data/student.ts` | Trực tiếp import | Bảng `academy_enrollments`      | Authenticated owner | PR 3       |
| Bài học chi tiết   | `/student/.../lessons/...` | `LessonViewer`    | `src/data/courses.ts` | Trực tiếp import | Bảng `academy_lessons`          | Authenticated owner | PR 3       |
