import { getSupabaseBrowserClient } from "../src/lib/supabase/client";

// Search RPCs and tables related to enrollment or phone checking
async function checkDbStructure() {
  console.log("Checking DB tables/RPCS for student enrollment check...");
  // Let's test querying public.course_registrations with phone
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    console.log("No supabase client configured locally.");
    return;
  }
  const { data: regData, error: regError } = await supabase
    .from("course_registrations")
    .select("id, phone, status, course_id, batch_id")
    .limit(5);

  console.log("course_registrations sample:", regData, "error:", regError);

  const { data: enrollData, error: enrollError } = await supabase
    .from("academy_enrollments")
    .select("*")
    .limit(5);

  console.log("academy_enrollments sample:", enrollData, "error:", enrollError);
}

checkDbStructure();
