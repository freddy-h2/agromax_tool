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

const assetId = "LF98eF5RW01yEc00NcwmLAAQhvw7qUntxw6YXhaDi63rw";

async function enableSingle() {
    try {
        console.log(`Updating asset ${assetId}...`);
        const result = await mux.video.assets.update(assetId, { mp4_support: 'capped-1080p' });
        console.log("Update response:", result.mp4_support);

        console.log("Retrieving fresh asset...");
        const fresh = await mux.video.assets.retrieve(assetId);
        console.log("Fresh MP4 Support:", fresh.mp4_support);
        console.log("Fresh Static Renditions:", JSON.stringify(fresh.static_renditions, null, 2));
        console.log("Status:", result.status);

    } catch (err) {
        console.error("Error:", err);
    }
}

enableSingle();
