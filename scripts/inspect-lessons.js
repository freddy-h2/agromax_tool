
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function inspect() {
    console.log("Fetching one lesson to inspect columns...");
    const { data, error } = await supabase.from("course_lessons").select("*").limit(1);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No lessons found.");
        return;
    }

    const lesson = data[0];
    console.log("Columns found:", Object.keys(lesson));
    console.log("Sample Data:", lesson);
}

inspect();
