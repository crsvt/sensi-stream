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

/**
 * Connects to the Sensibull WebSocket and subscribes to data feeds.
 * @param {string[]} instruments Array of instrument tokens to subscribe to.
 * @param {string[]} expiries Array of expiry dates.
 */
function connect(instruments, expiries) {
    const ws = new WebSocket(WEBSOCKET_URL, { headers: HEADERS });

    ws.on('open', () => {
        console.log('✅ WebSocket connection established.');

        // We only need one expiry for this example
        const targetExpiry = expiries[0];
        if (!targetExpiry) {
            console.error('❌ No expiry date found. Exiting.');
            ws.close();
            return;
        }

        console.log(`Subscribing to instruments for expiry: ${targetExpiry}`);

        const subscriptionMessage = {
            "msgCommand": "subscribe",
            "dataSource": "option-chain",
            "brokerId": 1,
            "tokens": [],
            "underlyingExpiry": instruments.map(inst => ({ "underlying": inst, "expiry": targetExpiry })),
            "uniqueId": ""
        };

        ws.send(JSON.stringify(subscriptionMessage));
    });

    ws.on('message', (binaryData) => {
        const message = decode(binaryData);
        if (message) {
            console.log(`Received data for token: ${message.token}`);
            const filePath = path.join(DATA_DIR, `${message.token}-${message.expiry}.json`);
            fs.writeFileSync(filePath, JSON.stringify(message.payload, null, 2));
        }
    });

    ws.on('close', () => {
        console.log('🔌 WebSocket connection closed.');
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
    });
}

module.exports = { connect };