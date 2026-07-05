export type StudentBootstrapState =
  | "ACTIVE"
  | "NO_STUDENT_ACCOUNT"
  | "NO_CUSTOMER"
  | "NO_ACTIVE_MEMBERSHIP";

export interface StudentAccount {
  id: string;
  user_id: string;
  customer_id: string | null;
  created_at: string;
}

export interface StudentCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tier_id: string | null;
  created_at: string;
}

export interface StudentMembership {
  id: string;
  customer_id: string;
  tier_id: string;
  created_at: string;
  starts_at: string;
  ends_at: string | null;
}

export interface CustomerTier {
  id: string;
  code: string;
  name: string;
  rank: number;
  is_active: boolean;
  color_hex?: string | null;
}

export interface StudentBootstrapPayload {
  state: StudentBootstrapState;
  student_account: StudentAccount | null;
  customer: StudentCustomer | null;
  active_membership: StudentMembership | null;
  tier: CustomerTier | null;
  latest_expired_membership: StudentMembership | null;
}

export function validateStudentBootstrapPayload(payload: any): StudentBootstrapPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload must be an object");
  }

  const validStates: StudentBootstrapState[] = [
    "ACTIVE",
    "NO_STUDENT_ACCOUNT",
    "NO_CUSTOMER",
    "NO_ACTIVE_MEMBERSHIP",
  ];

  if (!validStates.includes(payload.state)) {
    throw new Error(`Unknown state: ${payload.state}`);
  }

  const isUUID = (str: any) => typeof str === "string" && str.length > 0;
  const isString = (str: any) => typeof str === "string";

  if (payload.state === "ACTIVE") {
    if (
      !payload.student_account ||
      !payload.customer ||
      !payload.active_membership ||
      !payload.tier
    ) {
      throw new Error("Missing required fields for ACTIVE state");
    }

    if (!isUUID(payload.student_account.id)) throw new Error("Invalid student_account.id");
    if (!isUUID(payload.customer.id)) throw new Error("Invalid customer.id");
    if (!isUUID(payload.active_membership.id)) throw new Error("Invalid active_membership.id");
    if (!isUUID(payload.tier.id)) throw new Error("Invalid tier.id");

    if (typeof payload.tier.rank !== "number" || !isFinite(payload.tier.rank)) {
      throw new Error("tier.rank must be a finite number");
    }

    if (payload.tier.is_active !== true) {
      throw new Error("tier.is_active must be true for ACTIVE state");
    }

    if (
      !isString(payload.active_membership.starts_at) ||
      payload.active_membership.starts_at.length === 0
    ) {
      throw new Error("active_membership.starts_at must be a non-empty string");
    }

    if (
      payload.active_membership.ends_at !== null &&
      (!isString(payload.active_membership.ends_at) ||
        payload.active_membership.ends_at.length === 0)
    ) {
      throw new Error("active_membership.ends_at must be null or a non-empty string");
    }
  }

  if (payload.state === "NO_CUSTOMER") {
    if (!payload.student_account || payload.customer !== null) {
      throw new Error("NO_CUSTOMER requires student_account and null customer");
    }
  }

  if (payload.state === "NO_ACTIVE_MEMBERSHIP") {
    if (!payload.student_account || !payload.customer) {
      throw new Error("NO_ACTIVE_MEMBERSHIP requires student_account and customer");
    }
  }

  return payload as StudentBootstrapPayload;
}
