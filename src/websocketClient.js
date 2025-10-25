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

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

let noDataTimeout;

function connect(instruments, expiries) {
    const ws = new WebSocket(WEBSOCKET_URL, { headers: HEADERS });

    ws.on('open', () => {
        console.log('✅ WebSocket connection established.');
        clearTimeout(noDataTimeout);

        const targetExpiry = expiries[0];
        if (!targetExpiry) {
            console.error('❌ No expiry date found. Exiting.');
            ws.close();
            return;
        }

        // --- NEW: Subscribe to all three required data sources ---

        // 1. Subscribe to Underlying Stats
        const statsSub = {
            "msgCommand": "subscribe",
            "dataSource": "underlying-stats",
            "brokerId": 1,
            "tokens": instruments,
            "underlyingExpiry": [],
            "uniqueId": ""
        };
        console.log("--> Sending 'underlying-stats' subscription...");
        ws.send(JSON.stringify(statsSub));

        // 2. Subscribe to Quote Binary
        const quoteSub = {
            "msgCommand": "subscribe",
            "dataSource": "quote-binary",
            "brokerId": 1,
            "tokens": instruments,
            "underlyingExpiry": [],
            "uniqueId": ""
        };
        console.log("--> Sending 'quote-binary' subscription...");
        ws.send(JSON.stringify(quoteSub));

        // 3. Subscribe to Option Chain
        const optionChainSub = {
            "msgCommand": "subscribe",
            "dataSource": "option-chain",
            "brokerId": 1,
            "tokens": [],
            "underlyingExpiry": instruments.map(inst => ({ "underlying": inst, "expiry": targetExpiry })),
            "uniqueId": ""
        };
        console.log(`--> Sending 'option-chain' subscription for expiry: ${targetExpiry}...`);
        ws.send(JSON.stringify(optionChainSub));

        noDataTimeout = setTimeout(() => {
            console.warn('🕒 No option chain data received after 30 seconds. Is the market open?');
        }, 30000);
    });
    
    ws.on('ping', () => {
        console.log('Received ping from server. Sending pong.');
        ws.pong();
    });

    ws.on('message', (binaryData) => {
        const message = decode(binaryData);
        
        if (message) {
            if (message.kind === 'OPTION_CHAIN') {
                // This is the data we want, so clear the timeout.
                clearTimeout(noDataTimeout);

                // --- MODIFICATION START ---
                const { payload, token, expiry } = message;
                const { future_price, atm_strike, pcr, max_pain_strike, atm_iv } = payload;

                // Provide a richer, more insightful log message to the console
                console.log(
                    `✅ [${new Date().toLocaleTimeString()}] Chain for ${token}: ` +
                    `Future: ${future_price}, ATM: ${atm_strike}, IV: ${(atm_iv * 100).toFixed(2)}%, PCR: ${pcr}, Max Pain: ${max_pain_strike}`
                );
                
                const filePath = path.join(DATA_DIR, `${token}-${expiry}.json`);
                // Save the full payload as before
                fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
                // --- MODIFICATION END ---

            } else {
                // Log other valid packets we are receiving.
                console.log(`-> Received packet of type: ${message.kind}`);
            }
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`🔌 WebSocket connection closed. Code: ${code}, Reason: ${String(reason)}`);
        clearTimeout(noDataTimeout);
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        clearTimeout(noDataTimeout);
    });
}

module.exports = { connect };