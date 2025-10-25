const { getExpiryDates } = require('./utils');
const { connect } = require('./websocketClient');
const config = require('../config');
const open = require('open'); // <-- NEW: Import 'open'
const { startServer } = require('./webServer'); // <-- NEW: Import web server

function main() {
    console.log("🚀 Starting Sensi-Stream...");

    // --- Start the web server ---
    startServer(); // <-- NEW

    // --- Build the list of instruments to track from the config ---
    const instrumentsToTrack = [];
    if (config.track_nifty) {
        instrumentsToTrack.push(config.tokens.nifty);
        console.log("-> Configuration: Tracking NIFTY.");
    }
    if (config.track_banknifty) {
        instrumentsToTrack.push(config.tokens.banknifty);
        console.log("-> Configuration: Tracking BANKNIFTY.");
    }

    if (instrumentsToTrack.length === 0) {
        console.error("❌ No instruments are enabled in config.js. Exiting.");
        return;
    }

    // --- Get expiries based on the config settings ---
    const expiries = getExpiryDates(config);
    
    if (expiries.length === 0) {
        console.error("❌ No expiry types are enabled in config.js or dates could not be found. Exiting.");
        return;
    }
    
    console.log("Found Expiry Dates to Track:", expiries);

    // --- Pass the config to the connect function ---
    connect(instrumentsToTrack, expiries, config);

    // --- Open the browser ---
    setTimeout(() => {
        open('http://localhost:3000'); // <-- NEW: Open the dashboard
    }, 1500); // Small delay to allow server to start
}

main();