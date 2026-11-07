
const SUPABASE_URL = "https://mygejxqkcbonjgtubpdn.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_FEz6MigKIdHWaWhIHYolbg_WwRHwuG1";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);