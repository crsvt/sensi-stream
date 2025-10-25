const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { decode } = require('./dataDecoder');

const WEBSOCKET_URL = 'https://wsrelay.sensibull.com/broker/1?consumerType=platform_pro';

const HEADERS = {
    'Accept-Encoding': 'gzip, deflate',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Origin': 'https://web.sensibull.com'
};

// --- NEW: Configuration for the retry mechanism ---
const RETRY_CONFIG = {
    maxRetries: 10,           // Maximum number of reconnection attempts.
    initialDelay: 2000,       // Initial delay in ms (2 seconds).
    maxDelay: 60000,          // Maximum delay in ms (1 minute).
};

let retryCount = 0;
let noDataTimeout;
let ws; // --- NEW: Make 'ws' accessible in the module scope for reconnection.

/**
 * --- MODIFIED: Main function to start and manage the WebSocket connection. ---
 * This function now handles the entire lifecycle, including initial connection and reconnections.
 */
function connect(instruments, expiries, config) {
    // Ensure the data directory exists.
    const DATA_DIR = path.resolve(__dirname, '..', config.data_directory);
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (retryCount === 0) {
        console.log("🚀 Attempting to connect to WebSocket...");
    }
    
    ws = new WebSocket(WEBSOCKET_URL, { headers: HEADERS });

    ws.on('open', () => {
        console.log('✅ WebSocket connection established.');
        retryCount = 0; // Reset retry counter on a successful connection.
        clearTimeout(noDataTimeout);

        const targetExpiry = expiries[0];
        if (!targetExpiry) {
            console.error('❌ No expiry date found. Exiting.');
            ws.close();
            return;
        }
        
        // Subscribe to all required data sources.
        subscribeToData(instruments, targetExpiry);

        noDataTimeout = setTimeout(() => {
            console.warn('🕒 No option chain data received after 30 seconds. Is the market open?');
        }, 30000);
    });
    
    ws.on('ping', () => {
        // This is a frequent message, so it's commented out to keep the log clean.
        // console.log('Received ping from server. Sending pong.');
        ws.pong();
    });

    ws.on('message', (binaryData) => {
        const message = decode(binaryData);
        
        if (message) {
            if (message.kind === 'OPTION_CHAIN') {
                clearTimeout(noDataTimeout);
                const { payload, token, expiry } = message;
                const { future_price, atm_strike, pcr, max_pain_strike, atm_iv } = payload;
                
                console.log(
                    `✅ [${new Date().toLocaleTimeString()}] Chain for ${token}: ` +
                    `Future: ${future_price}, ATM: ${atm_strike}, IV: ${(atm_iv * 100).toFixed(2)}%, PCR: ${pcr}, Max Pain: ${max_pain_strike}`
                );
                
                const filePath = path.join(DATA_DIR, `${token}-${expiry}.json`);
                // --- SECURE HANDLING: Use try-catch for file operations ---
                try {
                    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
                } catch (error) {
                    console.error(`❌ Failed to write data to file: ${filePath}`, error);
                }
            } else {
                // To avoid clutter, we don't log every non-chain packet by default.
                // console.log(`-> Received packet of type: ${message.kind}`);
            }
        }
    });

    // --- MODIFIED: Enhanced 'close' event handler to trigger reconnection. ---
    ws.on('close', (code, reason) => {
        console.log(`🔌 WebSocket connection closed. Code: ${code}, Reason: ${String(reason)}`);
        clearTimeout(noDataTimeout);
        handleReconnect(instruments, expiries, config);
    });

    // --- MODIFIED: Enhanced 'error' event handler. ---
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        clearTimeout(noDataTimeout);
        // The 'close' event will usually fire immediately after 'error', 
        // so we let the 'close' handler manage the reconnection logic to avoid duplication.
        ws.terminate(); // Forcefully close the connection to trigger the 'close' event.
    });
}

/**
 * --- NEW: Logic for sending subscriptions. ---
 * Extracted for clarity and reuse upon reconnection.
 */
function subscribeToData(instruments, targetExpiry) {
    const subscriptions = [
        { "msgCommand": "subscribe", "dataSource": "underlying-stats", "brokerId": 1, "tokens": instruments, "underlyingExpiry": [], "uniqueId": "" },
        { "msgCommand": "subscribe", "dataSource": "quote-binary", "brokerId": 1, "tokens": instruments, "underlyingExpiry": [], "uniqueId": "" },
        { "msgCommand": "subscribe", "dataSource": "option-chain", "brokerId": 1, "tokens": [], "underlyingExpiry": instruments.map(inst => ({ "underlying": inst, "expiry": targetExpiry })), "uniqueId": "" }
    ];

    subscriptions.forEach(sub => {
        console.log(`--> Sending '${sub.dataSource}' subscription for expiry ${targetExpiry}...`);
        ws.send(JSON.stringify(sub));
    });
}

/**
 * --- NEW: Secure reconnection handler with exponential backoff. ---
 */
function handleReconnect(instruments, expiries, config) {
    if (retryCount >= RETRY_CONFIG.maxRetries) {
        console.error(`❌ Maximum retry limit (${RETRY_CONFIG.maxRetries}) reached. Giving up.`);
        return;
    }

    retryCount++;
    // Exponential backoff formula: delay * 2^retries, with a cap.
    const delay = Math.min(RETRY_CONFIG.initialDelay * Math.pow(2, retryCount - 1), RETRY_CONFIG.maxDelay);
    
    console.log(`Retrying connection in ${delay / 1000} seconds... (Attempt ${retryCount}/${RETRY_CONFIG.maxRetries})`);

    setTimeout(() => {
        connect(instruments, expiries, config);
    }, delay);
}


module.exports = { connect };