import Mux from "@mux/mux-node";
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
            process.env[key] = value;
        }
    });
}

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    console.error("❌ Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET in .env.local");
    process.exit(1);
}

const mux = new Mux({
    tokenId: MUX_TOKEN_ID,
    tokenSecret: MUX_TOKEN_SECRET
});

async function run() {
    console.log("--- Verifying Mux Access ---");
    try {
        const assets = await mux.video.assets.list({ limit: 5 });
        console.log(`✅ Automatically connected to Mux. Found ${assets.data.length} assets (showing limit 5).`);

        if (assets.data.length > 0) {
            console.log("\nSample First Asset FULL JSON:");
            console.log(JSON.stringify(assets.data[0], null, 2));

            console.log("\nSample Assets List:");
            assets.data.forEach(asset => {
                console.log(`- ID: ${asset.id}, Status: ${asset.status}, Duration: ${asset.duration}s`);
            });
        }
    } catch (error: any) {
        console.error("❌ Error connecting to Mux:", error.message || error);
    }
}

run();
