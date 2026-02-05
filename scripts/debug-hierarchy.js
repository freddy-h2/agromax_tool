
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Mux = require('@mux/mux-node');

// 1. Load Environment Variables manually
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('No .env.local file found at:', envPath);
        process.exit(1);
    }
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    for (const line of lines) {
        if (!line || line.startsWith('#')) continue;
        const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let key = match[1].trim();
            let value = match[2] ? match[2].trim() : '';
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            env[key] = value;
        }
    }
    console.log('Env Keys Found:', Object.keys(env));
    return env;
}

const env = loadEnv();
const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['PRODUCTION_SUPABASE_SERVICE_ROLE_KEY'];
const MUX_TOKEN_ID = env['MUX_TOKEN_ID'];
const MUX_TOKEN_SECRET = env['MUX_TOKEN_SECRET'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    console.error('Missing env vars:', {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_SERVICE_KEY,
        hasMuxId: !!MUX_TOKEN_ID,
        hasMuxSecret: !!MUX_TOKEN_SECRET
    });
    process.exit(1);
}

// 2. Initialize Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

async function debug() {
    console.log('--- STARTING DEBUG ---');

    // 3. Fetch one lesson with a mux_asset_id
    console.log('Fetching a lesson with mux_asset_id...');
    const { data: lessons, error: dbError } = await supabase
        .from('course_lessons')
        .select('*')
        .not('mux_asset_id', 'is', null)
        .limit(1);

    if (dbError) {
        console.error('DB Error:', dbError);
        return;
    }

    if (!lessons || lessons.length === 0) {
        console.log('No lessons with mux_asset_id found in DB.');
        return;
    }

    const lesson = lessons[0];
    console.log('Lesson found:', {
        id: lesson.id,
        title: lesson.title,
        mux_asset_id: lesson.mux_asset_id,
        mux_playback_id: lesson.mux_playback_id
    });

    // 4. Fetch Mux Assets
    console.log('Fetching Mux Assets...');
    // Use the native client method properly. Mux v8+ might have different signature. 
    // Assuming new Mux() structure from package.json version ^12.8.1
    try {
        const assets = await mux.video.assets.list({ limit: 100 });
        console.log(`Fetched ${assets.data.length} assets from Mux.`);

        // 5. Try to find the match
        const match = assets.data.find(a => a.id === lesson.mux_asset_id);

        if (match) {
            console.log('MATCH FOUND in Mux List!');
            console.log('Mux Asset:', {
                id: match.id,
                playback_ids: match.playback_ids
            });
            if (match.playback_ids && match.playback_ids.length > 0) {
                console.log('Mapped Playback ID:', match.playback_ids[0].id);
            } else {
                console.log('WARNING: Match found but no playback_ids in Mux object.');
            }
        } else {
            console.error('CRITICAL: Lesson mux_asset_id NOT FOUND in the first 100 Mux assets.');
            console.log('First 3 Mux Asset IDs for reference:', assets.data.slice(0, 3).map(a => a.id));
        }

    } catch (muxError) {
        console.error('Mux API Error:', muxError);
    }
}

debug();
