import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Manually load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split(/\r?\n/).forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
            // console.log(`Setting env: ${key}`);
            process.env[key] = value;
        }
    });
}

const PROJECT_URL = process.env.VITE_SUPABASE_URL;
// Using Service Role Key as suggested by the comment in .env.local to bypass RLS for initial verification
const SERVICE_KEY = process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY;

if (!PROJECT_URL || !SERVICE_KEY) {
    console.error("❌ Missing VITE_SUPABASE_URL or PRODUCTION_SUPABASE_SERVICE_ROLE_KEY in .env.local");
    // Debug: print loaded keys (masked)
    console.log("Loaded keys:", Object.keys(process.env).filter(k => k.includes("SUPABASE")));
    process.exit(1);
}

console.log(`Connecting to Supabase at: ${PROJECT_URL}`);

const supabase = createClient(PROJECT_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function verifyTable(tableName: string) {
    try {
        console.log(`\n--- Querying table: ${tableName} ---`);
        // Select all columns to see what we get, limit to 10 just in case
        const { data, error, count } = await supabase
            .from(tableName)
            .select("*")
            .limit(10);

        if (error) {
            console.error(`❌ Error accessing table '${tableName}':`, error.message);
            return false;
        }

        console.log(`✅ Table '${tableName}' is accessible. Rows returned: ${data?.length}`);

        if (data && data.length > 0) {
            console.log(`Columns for ${tableName}:`, Object.keys(data[0]));
        } else {
            console.warn(`⚠️ Table '${tableName}' is empty.`);
        }
        return true;
    } catch (e) {
        console.error(`❌ Exception accessing table '${tableName}':`, e);
        return false;
    }
}

async function run() {
    console.log("--- Verifying Access to Tables ---");

    const tablesToCheck = ["communities", "courses", "course_modules", "course_lessons"];

    for (const table of tablesToCheck) {
        await verifyTable(table);
    }

    console.log("--- Verification Complete ---");
}

run();
