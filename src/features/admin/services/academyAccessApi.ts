import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface AcademyStudentAccessSummary {
  id: string;
  user_id: string;
  status: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  customer_id: string | null;
}

export interface StudentCourseAccessOverride {
  id: string;
  course_id: string;
  course_title: string;
  decision: string;
  access_scope: string;
  reason: string;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
}

export const academyAccessApi = {
  async searchStudents(query: string, limit: number = 20): Promise<AcademyStudentAccessSummary[]> {
    const { data, error } = await getSupabaseBrowserClient()!.rpc("admin_search_academy_students_for_access", {
      p_query: query || null,
      p_limit: limit
    });
    if (error) {
      console.error("Error searching students:", error);
      throw error;
    }
    return data || [];
  },

  async listStudentAccess(studentId: string): Promise<StudentCourseAccessOverride[]> {
    const { data, error } = await getSupabaseBrowserClient()!.rpc("admin_list_student_course_access", {
      p_student_id: studentId
    });
    if (error) {
      console.error("Error listing student access:", error);
      throw error;
    }
    return data || [];
  },

  async grantAccess(
    studentId: string, 
    courseId: string, 
    scopes: string[], 
    expiresAt: string, 
    reason: string
  ): Promise<{ success: boolean; message: string; inserted_ids?: string[] }> {
    const { data, error } = await getSupabaseBrowserClient()!.rpc("admin_grant_student_course_access", {
      p_student_id: studentId,
      p_course_id: courseId,
      p_access_scopes: scopes,
      p_expires_at: expiresAt,
      p_reason: reason
    });
    if (error) {
      console.error("Error granting access:", error);
      throw error;
    }
    return data;
  },

  async revokeAccess(
    overrideId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    const { data, error } = await getSupabaseBrowserClient()!.rpc("admin_revoke_student_course_access", {
      p_override_id: overrideId,
      p_reason: reason
    });
    if (error) {
      console.error("Error revoking access:", error);
      throw error;
    }
    return data;
  },

  async blockAccess(
    studentId: string,
    courseId: string,
    expiresAt: string | null,
    reason: string
  ): Promise<{ success: boolean; message: string; inserted_id?: string }> {
    const { data, error } = await getSupabaseBrowserClient()!.rpc("admin_block_student_course_access", {
      p_student_id: studentId,
      p_course_id: courseId,
      p_expires_at: expiresAt || null,
      p_reason: reason
    });
    if (error) {
      console.error("Error blocking access:", error);
      throw error;
    }
    return data;
  }
};
