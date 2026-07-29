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
