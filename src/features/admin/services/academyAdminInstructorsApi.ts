import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface Instructor {
  id: string;
  full_name: string;
  slug: string | null;
  title: string | null;
  avatar_url: string | null;
  expertise: string[];
  bio: string | null;
  highlights: string[];
  social_links: {
    website?: string;
    facebook?: string;
    linkedin?: string;
  } | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface InstructorFormData {
  full_name: string;
  slug?: string;
  title?: string;
  avatar_url?: string;
  expertise?: string[];
  bio?: string;
  highlights?: string[];
  social_links?: {
    website?: string;
    facebook?: string;
    linkedin?: string;
  };
  is_active?: boolean;
  display_order?: number;
}

export async function getAdminInstructors(): Promise<Instructor[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase
    .from("academy_instructors")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching instructors:", error);
    throw error;
  }

  return data || [];
}

export async function createInstructor(payload: InstructorFormData): Promise<Instructor> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase
    .from("academy_instructors")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating instructor:", error);
    throw error;
  }

  return data;
}

export async function updateInstructor(id: string, payload: Partial<InstructorFormData>): Promise<Instructor> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase
    .from("academy_instructors")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating instructor:", error);
    throw error;
  }

  return data;
}

export async function deleteInstructor(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  // We could soft delete, but providing hard delete as requested
  const { error } = await supabase
    .from("academy_instructors")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting instructor:", error);
    throw error;
  }
}
