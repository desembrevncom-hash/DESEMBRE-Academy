import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { resolve } from 'path';
import { courseOutlineSchema } from './src/features/courses/validators';

const envContent = fs.readFileSync(resolve('.env.local'), 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length > 0) env[key.trim()] = vals.join('=').trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL']!;
const supabaseAnonKey = env['VITE_SUPABASE_PUBLISHABLE_KEY']!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugZod() {
  const { data: outline, error } = await supabase.rpc('get_academy_public_course_outline', { p_course_slug: 'course-b-v4' });
  if (error) {
    console.error("RPC Error:", error);
    return;
  }
  
  console.log("Raw Outline JSON keys:", Object.keys(outline));
  if (outline.course) {
    console.log("Course keys:", Object.keys(outline.course));
  }
  
  if (outline.modules && outline.modules.length > 0) {
    console.log("Module 0 keys:", Object.keys(outline.modules[0]));
    if (outline.modules[0].lessons && outline.modules[0].lessons.length > 0) {
       console.log("Lesson 0 keys:", Object.keys(outline.modules[0].lessons[0]));
       console.log("Lesson 0 data:", outline.modules[0].lessons[0]);
    }
  }

  const parsed = courseOutlineSchema.safeParse(outline);
  if (!parsed.success) {
    console.error("Zod Parse Error for Course B:");
    console.dir(parsed.error.format(), { depth: null });
  } else {
    console.log("Zod Parse Success!");
  }
}

debugZod();
