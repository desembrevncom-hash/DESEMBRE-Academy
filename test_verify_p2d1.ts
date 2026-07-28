import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve('F:\\Downloads\\DESEMBRE-Workspace\\Desembre Academy\\.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Checking Leak for course-b-v4...");
  const { data: outlineB, error: errOutlineB } = await supabase.rpc('get_academy_public_course_outline', { p_course_slug: 'course-b-v4' });
  
  if (errOutlineB) {
    console.error("Error fetching outline B:", errOutlineB);
  } else {
    const outlineStr = JSON.stringify(outlineB).toLowerCase();
    console.log("Leak Check Result:");
    console.log("has_content_markdown:", outlineStr.includes('content_markdown'));
    console.log("has_storage_path:", outlineStr.includes('storage_path'));
    console.log("has_external_url:", outlineStr.includes('external_url'));
    console.log("has_signed_url:", outlineStr.includes('signed'));
  }

  console.log("\nChecking Catalog Course A v4...");
  const { data: catalog, error: errCatalog } = await supabase.rpc('get_academy_public_course_catalog');
  if (catalog) {
     const courseA = catalog.find((c: any) => c.slug === 'course-a-v4');
     if (courseA) {
       console.log("Course A Catalog Marketing:", courseA.marketing);
     } else {
       console.log("Course A not found in catalog");
     }
  }

  console.log("\nChecking Outline Course A v4...");
  const { data: outlineA, error: errOutlineA } = await supabase.rpc('get_academy_public_course_outline', { p_course_slug: 'course-a-v4' });
  if (outlineA?.course) {
     console.log("Course A Outline Marketing:", outlineA.course.marketing);
  } else {
     console.log("Course A outline error/not found:", errOutlineA);
  }
}

check();
