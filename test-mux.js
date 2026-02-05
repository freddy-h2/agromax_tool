
const Mux = require('@mux/mux-node');

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

async function test() {
    console.log("Testing Mux Connection...");
    console.log("Token:", process.env.MUX_TOKEN_ID ? "Found" : "Missing");
    try {
        const upload = await mux.video.uploads.create({
            cors_origin: "*",
            new_asset_settings: {
                playback_policy: ["public"],
                // mp4_support: "standard", // Removed due to API error
                master_access: "temporary",
            },
        });
        console.log("Success! Upload URL created:", upload.url);
    } catch (e) {
        console.error("Mux Error:", JSON.stringify(e, null, 2));
    }
}

test();
