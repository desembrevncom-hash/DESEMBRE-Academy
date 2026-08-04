import { getSupabaseBrowserClient } from "../src/lib/supabase/client";

async function inspectDbTables() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    console.log("No supabase client.");
    return;
  }

  // Check academy_orders
  const { data: orders, error: ordersError } = await supabase
    .from("academy_orders")
    .select("*")
    .limit(1);

  console.log("academy_orders check:", { exists: !ordersError, error: ordersError?.message });

  // Check student_course_access
  const { data: access, error: accessError } = await supabase
    .from("student_course_access")
    .select("*")
    .limit(1);

  console.log("student_course_access check:", { exists: !accessError, error: accessError?.message });
}

inspectDbTables();
