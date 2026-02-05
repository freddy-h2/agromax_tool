
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Mux = require('@mux/mux-node');

// Load Env
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) return {};
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
    return env;
}

const env = loadEnv();
const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['PRODUCTION_SUPABASE_SERVICE_ROLE_KEY'];
const MUX_TOKEN_ID = env['MUX_TOKEN_ID'];
const MUX_TOKEN_SECRET = env['MUX_TOKEN_SECRET'];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

async function compare() {
    console.log('--- COMPARING ASSET POLICIES ---');

    console.log('1. Fetching linked assets from DB...');
    const { data: lessons } = await supabase
        .from('course_lessons')
        .select('mux_asset_id')
        .not('mux_asset_id', 'is', null);

    const linkedAssetIds = new Set(lessons.map(l => l.mux_asset_id));
    console.log(`Found ${linkedAssetIds.size} linked assets in DB.`);

    console.log('2. Fetching recent assets from Mux...');
    const { data: assets } = await mux.video.assets.list({ limit: 50 });

    let linkedCount = 0;
    let orphanCount = 0;
    let linkedPolicies = new Set();
    let orphanPolicies = new Set();
    let sampleLinked = null;
    let sampleOrphan = null;

    console.log('3. Analyzing Policies...');
    for (const asset of assets) {
        const policy = asset.playback_ids?.[0]?.policy || 'unknown';

        if (linkedAssetIds.has(asset.id)) {
            linkedCount++;
            linkedPolicies.add(policy);
            if (!sampleLinked) sampleLinked = { id: asset.id, policy };
        } else {
            orphanCount++;
            orphanPolicies.add(policy);
            if (!sampleOrphan) sampleOrphan = { id: asset.id, policy };
        }
    }

    console.log('\n--- RESULTS ---');
    console.log('[SUBIDO / Linked Assets]');
    console.log(`Count in sample: ${linkedCount}`);
    console.log(`Policies found: ${Array.from(linkedPolicies).join(', ')}`);
    if (sampleLinked) console.log(`Sample: ${JSON.stringify(sampleLinked)}`);

    console.log('\n[POR SUBIR / Orphan Assets]');
    console.log(`Count in sample: ${orphanCount}`);
    console.log(`Policies found: ${Array.from(orphanPolicies).join(', ')}`);
    if (sampleOrphan) console.log(`Sample: ${JSON.stringify(sampleOrphan)}`);
}

compare();
