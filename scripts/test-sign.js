
const fs = require('fs');
const path = require('path');
const Mux = require('@mux/mux-node');

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
const MUX_TOKEN_ID = env['MUX_TOKEN_ID'];
const MUX_TOKEN_SECRET = env['MUX_TOKEN_SECRET'];

// Sample Signed Playback ID from previous debug
const PLAYBACK_ID = '9dB006896it5lmI7N9cVe4NtpnjVdyc33L7jBb9Ia8OQ';

async function testSign() {
    console.log('Testing Mux Token Signing...');
    console.log('ID:', MUX_TOKEN_ID);
    console.log('Secret Length:', MUX_TOKEN_SECRET ? MUX_TOKEN_SECRET.length : 0);

    try {
        const client = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });
        console.log('Client created.');
        if (client.jwt) {
            console.log('client.jwt exists.');
            const token = await client.jwt.signPlaybackId(PLAYBACK_ID, {
                expiration: '24h'
            });
            console.log('Token Generated Successfully!');
            console.log('Token:', token);
        } else {
            console.log('client.jwt is undefined');
            console.log('Client keys:', Object.keys(client));
        }

    } catch (err) {
        console.error('Signing Failed:', err);
    }
}

testSign();
