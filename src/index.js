const { getExpiryDates } = require('./utils');
const { connect } = require('./websocketClient');
const config = require('../config');

// Conditionally import dashboard-related modules only if needed
let open, startServer;
if (config.dashboard_settings && config.dashboard_settings.enable_dashboard) {
    open = require('open');
    ({ startServer } = require('./webServer'));
}

/**
 * Initializes the WebSocket client and connects to the data feed.
 */
function startClient() {
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
}

/**
 * Main application entry point.
 */
function main() {
    console.log("🚀 Starting Sensi-Stream...");

    if (config.dashboard_settings && config.dashboard_settings.enable_dashboard) {
        console.log("-> Configuration: Web Dashboard is ENABLED.");
        
        // Start the server and provide a callback to run after it's live
        startServer(() => {
            // Now that the server is ready, start the WebSocket client
            startClient();

            // Conditionally open the browser
            if (config.dashboard_settings.auto_open_browser) {
                setTimeout(() => {
                    open('http://localhost:3000');
                }, 1500); // Small delay to allow server to start
            }
        });
    } else {
        console.log("-> Configuration: Web Dashboard is DISABLED. Running in console-only mode.");
        // If dashboard is off, run the client immediately
        startClient();
    }
}

main();