import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { type StudentBootstrapPayload, validateStudentBootstrapPayload } from "../types";

export type StudentBootstrapErrorKind =
  | "UNAUTHENTICATED"
  | "NETWORK"
  | "RLS_DENIED"
  | "INVALID_DATA"
  | "UNKNOWN";

export class StudentBootstrapError extends Error {
  constructor(
    public kind: StudentBootstrapErrorKind,
    message: string,
    public retryable: boolean = true,
  ) {
    super(message);
    this.name = "StudentBootstrapError";
  }
}

export const studentService = {
  async getBootstrapData(): Promise<StudentBootstrapPayload> {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      throw new StudentBootstrapError(
        "NETWORK",
        "Supabase client is not available in this environment",
        false,
      );
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new StudentBootstrapError("UNAUTHENTICATED", "No active session found", false);
    }

    const { data, error } = await supabase.rpc("get_current_student_bootstrap");

    if (error) {
      if (
        error.code === "42501" ||
        error.code === "PGRST301" ||
        error.message.toLowerCase().includes("permission denied")
      ) {
        throw new StudentBootstrapError(
          "RLS_DENIED",
          "Permission denied accessing student data",
          false,
        );
      }
      throw new StudentBootstrapError(
        "NETWORK",
        `Failed to load student data: ${error.message}`,
        true,
      );
    }

    try {
      return validateStudentBootstrapPayload(data);
    } catch (err: any) {
      throw new StudentBootstrapError("INVALID_DATA", `Invalid payload: ${err.message}`, false);
    }
  },
};
