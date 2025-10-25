const pako = require('pako');

const PACKET_TYPES = {
    INVALID: 0,
    QUOTE: 1,
    OPTION_CHAIN: 3,
    UNDERLYING_STATS: 5,
};

function bufferToIntLE(buffer) {
    return buffer.readUInt32LE(0);
}

function bufferToIntBE(buffer) {
    return buffer.readUInt32BE(0);
}

/**
 * Decodes the uncompressed, binary QUOTE packet which contains the full OHLC data.
 * Structure is non-standard: Token, LTP, High, Low, Open, Close.
 */
function decodeQuote(data) {
    const token = bufferToIntBE(data.slice(0, 4));
    const ltp = data.readInt32BE(4) / 100;
    const high = data.readInt32BE(8) / 100;
    const low = data.readInt32BE(12) / 100;
    const open = data.readInt32BE(16) / 100;
    const close = data.readInt32BE(20) / 100; // Previous day's close
    return { token, ltp, open, high, low, close };
}

/**
 * Decodes the gzipped, JSON-based UNDERLYING_STATS packet.
 */
function decodeUnderlyingStats(data) {
    const token = bufferToIntBE(data.slice(0, 4));
    const compressedData = data.slice(4);
    const decompressedData = pako.inflate(compressedData, { to: 'string' });
    const payload = JSON.parse(decompressedData);
    return { token, payload };
}

/**
 * Decodes the gzipped, JSON-based OPTION_CHAIN packet.
 */
function decodeOptionChain(data) {
    const token = bufferToIntLE(data.slice(0, 4));
    const expiryDateRaw = data.slice(4, 12).toString('utf-8');
    const expiry = `${expiryDateRaw.slice(0, 4)}-${expiryDateRaw.slice(4, 6)}-${expiryDateRaw.slice(6, 8)}`;
    
    const compressedData = data.slice(12);
    const decompressedData = pako.inflate(compressedData, { to: 'string' });
    const payload = JSON.parse(decompressedData);

    return { token, expiry, payload };
}

/**
 * Main decoder function that routes binary data to the correct sub-decoder.
 */
function decode(binaryData) {
    const data = Buffer.from(binaryData);
    if (data.length <= 1) {
        return null;
    }
    const packetId = data[0];
    const packetBody = data.slice(1);

    try {
        switch (packetId) {
            case PACKET_TYPES.OPTION_CHAIN:
                return { kind: 'OPTION_CHAIN', ...decodeOptionChain(packetBody) };

            case PACKET_TYPES.QUOTE:
                return { kind: 'QUOTE', ...decodeQuote(packetBody) };

            case PACKET_TYPES.UNDERLYING_STATS:
                // We can decode this, but we won't use it for now.
                return { kind: 'UNDERLYING_STATS', ...decodeUnderlyingStats(packetBody) };
            
            default:
                return null;
        }
    } catch (error) {
        console.error(`❌ Error decoding packet ID ${packetId}.`, error);
        return null;
    }
}

module.exports = { decode };