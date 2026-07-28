import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://ynmcoeapfycijblydyuw.supabase.co', 'sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09');
async function check() {
  console.log('Checking get_academy_public_course_catalog...');
  const { data, error } = await supabase.rpc('get_academy_public_course_catalog');
  console.log('Catalog Length:', data ? data.length : null, 'Error:', error?.message);
}
check();
