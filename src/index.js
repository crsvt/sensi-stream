const { getMonthlyExpiries } = require('./utils');
const { connect } = require('./websocketClient');

// Define the instruments you want to track (e.g., NIFTY, BANKNIFTY)
// You can find these tokens from Sensibull's network requests or other API sources.
// For example: NIFTY 50 Index is often 256265, BANKNIFTY is 260105
const INSTRUMENTS_TO_TRACK = [256265, 260105];

function main() {
    console.log("🚀 Starting Sensi-Stream...");
    
    const expiries = getMonthlyExpiries();
    
    if (expiries.length === 0) {
        console.error("Could not determine upcoming expiry dates. Please check system date.");
        return;
    }
    
    console.log("Found Expiry Dates:", expiries);

    // Connect and subscribe to the data feeds
    connect(INSTRUMENTS_TO_TRACK, expiries);
}

main();