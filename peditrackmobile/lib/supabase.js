// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xmhzzcwortwvfmyapycd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtaHp6Y3dvcnR3dmZteWFweWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyMjUyMTIsImV4cCI6MjA0MTgwMTIxMn0.4fAdvbRDrljLbzUVUHNEVdxyW0dOsqCy2hxVriv_tUI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
