import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hbushiecstrbbchalvut.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidXNoaWVjc3RyYmJjaGFsdnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODI1NzEsImV4cCI6MjA2MDM1ODU3MX0.9asiolhGRGyhfJJUVkdhjhZBR_oyF4EnFC0PxuwdiUA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 