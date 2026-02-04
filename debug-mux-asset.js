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

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    console.error("Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET");
    process.exit(1);
}

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

const assetId = "LF98eF5RW01yEc00NcwmLAAQhvw7qUntxw6YXhaDi63rw"; // ID from logs

async function inspectAsset() {
    try {
        console.log(`Inspecting Asset ID: ${assetId}`);
        const asset = await mux.video.assets.retrieve(assetId);
        console.log("Asset Status:", asset.status);
        console.log("MP4 Support:", asset.mp4_support);
        console.log("Static Renditions:", JSON.stringify(asset.static_renditions, null, 2));
        console.log("Master Access:", asset.master_access);

        if (!asset.static_renditions || asset.static_renditions.status !== 'ready') {
            console.log("\n--- DIAGNOSIS ---");
            console.log("MP4 Download (Static Renditions) is NOT enabled or NOT ready.");
            console.log("This is why the download returns 404.");
        } else {
            console.log("\n--- DIAGNOSIS ---");
            console.log("Static renditions look ready. 404 might be due to a different issue.");
        }

    } catch (err) {
        console.error("Error retrieving asset:", err);
    }
}

inspectAsset();
