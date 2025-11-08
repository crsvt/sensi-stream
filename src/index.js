const { getExpiryDates } = require('./utils');
const { connect } = require('./websocketClient');
const config = require('../config');

// Conditionally import dashboard-related modules only if needed
let open, startServer;
if (config.dashboard_settings && config.dashboard_settings.enable_dashboard) {
    open = require('open');
    ({ startServer } = require('./webServer'));
}

function main() {
    console.log("🚀 Starting Sensi-Stream...");

    // --- NEW: Conditionally start the web server ---
    if (config.dashboard_settings && config.dashboard_settings.enable_dashboard) {
        startServer();
        console.log("-> Configuration: Web Dashboard is ENABLED.");
    } else {
        console.log("-> Configuration: Web Dashboard is DISABLED. Running in console-only mode.");
    }

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

    // --- NEW: Conditionally open the browser ---
    if (config.dashboard_settings && config.dashboard_settings.enable_dashboard && config.dashboard_settings.auto_open_browser) {
        setTimeout(() => {
            open('http://localhost:3000');
        }, 1500); // Small delay to allow server to start
    }
}

main();