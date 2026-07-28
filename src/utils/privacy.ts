export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 6) return cleaned;
  // Mask middle digits: 84964638228 -> 84••••8228
  const start = cleaned.slice(0, 2);
  const end = cleaned.slice(-4);
  const middle = "•".repeat(cleaned.length - 6);
  return `+${start}${middle}${end}`;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0] || ""}***@${domain}`;
  const start = local.slice(0, 2);
  return `${start}***@${domain}`;
}

export function shortId(id: string | null | undefined): string {
  if (!id) return "";
  return `${id.substring(0, 8)}...`;
}

export function getStudentDisplayName(
  customerName?: string | null,
  email?: string | null,
  phone?: string | null,
  studentAccountId?: string | null
): string {
  if (customerName) return customerName;
  if (email) return maskEmail(email);
  if (phone) return maskPhone(phone);
  if (studentAccountId) return `Học viên ${shortId(studentAccountId)}`;
  return "Học viên (chưa cập nhật)";
}
