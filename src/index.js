const { getExpiryDates } = require('./utils');
const { connect } = require('./websocketClient');
const config = require('../config'); // <-- NEW: Load the configuration file

function main() {
    console.log("🚀 Starting Sensi-Stream...");

    // --- NEW: Build the list of instruments to track from the config ---
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

    // --- MODIFIED: Get expiries based on the config settings ---
    const expiries = getExpiryDates(config);
    
    if (expiries.length === 0) {
        console.error("❌ No expiry types are enabled in config.js or dates could not be found. Exiting.");
        return;
    }
    
    console.log("Found Expiry Dates to Track:", expiries);

    // --- MODIFIED: Pass the config to the connect function ---
    connect(instrumentsToTrack, expiries, config);
}

main();