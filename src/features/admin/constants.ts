export const CATALOG_VISIBILITY_OPTIONS = [
  { value: "public", label: "Công khai trên catalog" },
  { value: "tier", label: "Theo nhóm quyền / gói học viên" },
  { value: "private", label: "Không công khai, chỉ mở qua link trực tiếp" },
] as const;

export const ENROLLMENT_POLICY_OPTIONS = [
  { value: "open", label: "Mở - Tự do đăng ký" },
  { value: "approval", label: "Cần duyệt đăng ký" },
  { value: "assigned", label: "Chỉ học viên được gán" },
  { value: "closed", label: "Đóng đăng ký" },
] as const;

export const ACCESS_POLICY_OPTIONS = [
  { value: "dynamic", label: "Động - Theo vai trò & quyền học viên" },
  { value: "grandfathered", label: "Giữ quyền truy cập cũ" },
] as const;

export const PRICING_MODEL_OPTIONS = [
  { value: "free", label: "Miễn phí" },
  { value: "paid", label: "Trả phí" },
  { value: "included", label: "Bao gồm trong gói / membership" },
] as const;

export interface CourseTypeDefinition {
  slug: string;
  name: string;
  badgeClass: string;
  helperText: string;
  batchNotice?: string;
}

export const PREDEFINED_COURSE_TYPES: CourseTypeDefinition[] = [
  {
    slug: "lead-magnet-one-session",
    name: "Buổi học thu phễu",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    helperText: "Phù hợp cho webinar, demo, workshop ngắn hoặc lớp 1 buổi để thu lead. Sau khi tạo khóa học, hãy tạo 1 lớp khai giảng và thêm 1 buổi học cụ thể.",
    batchNotice: "Khóa học này phù hợp lớp 1 buổi. Sau khi tạo lớp, hãy thêm 1 buổi học để public hiển thị giờ học và ZNS nhắc lịch hoạt động đúng.",
  },
  {
    slug: "professional-topic",
    name: "Chuyên đề chuyên sâu",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
    helperText: "Phù hợp cho các chuyên đề đào tạo kiến thức & kỹ thuật nâng cao.",
  },
  {
    slug: "hands-on-workshop",
    name: "Workshop thực hành",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    helperText: "Phù hợp cho các buổi thực hành trực tiếp tại văn phòng hoặc spa.",
  },
  {
    slug: "multi-session-program",
    name: "Chương trình nhiều buổi",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    helperText: "Phù hợp cho chương trình đào tạo nhiều buổi. Sau khi tạo lớp, hãy thêm đầy đủ các buổi học để lịch và ZNS nhắc lịch hoạt động chính xác.",
  },
  {
    slug: "seminar-webinar",
    name: "Seminar / Webinar",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    helperText: "Phù hợp cho sự kiện hội thảo trực tiếp hoặc trực tuyến.",
  },
];

export function getCourseTypeMeta(slugOrName?: string | null): CourseTypeDefinition | null {
  if (!slugOrName) return null;
  const normalized = slugOrName.toLowerCase().trim();
  return (
    PREDEFINED_COURSE_TYPES.find(
      (ct) => ct.slug === normalized || ct.name.toLowerCase() === normalized
    ) || null
  );
}

