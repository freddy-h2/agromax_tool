
const Mux = require('@mux/mux-node');

console.log('Top level keys:', Object.keys(Mux));

if (Mux.Mux) {
    console.log('Mux.Mux keys:', Object.keys(Mux.Mux));
    try { console.log('Mux.Mux.JWT:', Mux.Mux.JWT); } catch (e) { }
}

if (Mux.default) {
    console.log('Mux.default keys:', Object.keys(Mux.default));
    try { console.log('Mux.default.JWT:', Mux.default.JWT); } catch (e) { }
}

// Check for JWT-like names
console.log('Searching for JWT...');
const allKeys = Object.keys(Mux);
allKeys.forEach(k => {
    if (k.match(/jwt/i)) console.log(`Found ${k}`);
});
