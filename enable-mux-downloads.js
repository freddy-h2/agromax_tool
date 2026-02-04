const Mux = require('@mux/mux-node');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error("Error loading .env.local:", e.message);
}

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

async function enableDownloads() {
    try {
        console.log("Fetching assets...");
        const assets = await mux.video.assets.list({ limit: 100 });
        const readyAssets = assets.data.filter(a => a.status === 'ready');

        console.log(`Found ${readyAssets.length} ready assets.`);

        for (const asset of readyAssets) {
            if (!asset.static_renditions || asset.static_renditions.status !== 'ready') {
                console.log(`Enabling MP4 support for ${asset.id}...`);
                try {
                    await mux.video.assets.update(asset.id, { mp4_support: 'standard' });
                    console.log(`  > Done. Processing may take a few seconds.`);
                } catch (e) {
                    console.error(`  > Failed to update ${asset.id}:`, e.message);
                }
            } else {
                console.log(`Asset ${asset.id} already has MP4 support.`);
            }
        }

        console.log("\nAll assets processed. Downloads should work shortly!");

    } catch (err) {
        console.error("Error:", err);
    }
}

enableDownloads();
