const pako = require('pako');

// --- UPDATED: Added more packet types we now expect ---
const PACKET_TYPES = {
    INVALID: 0,
    QUOTE: 1,
    OPTION_CHAIN: 3,
    UNDERLYING_STATS: 5,
};

function bufferToInt(buffer) {
    return buffer.readUInt32LE(0);
}

function decodeOptionChain(data) {
    const token = bufferToInt(data.slice(0, 4));
    const expiryDateRaw = data.slice(4, 12).toString('utf-8');
    const expiry = `${expiryDateRaw.slice(0, 4)}-${expiryDateRaw.slice(4, 6)}-${expiryDateRaw.slice(6, 8)}`;
    
    const compressedData = data.slice(12);
    const decompressedData = pako.inflate(compressedData, { to: 'string' });
    const payload = JSON.parse(decompressedData);

    return { token, expiry, payload };
}

function decode(binaryData) {
    const data = Buffer.from(binaryData);
    if (data.length <= 1) {
        // Not enough data to be a meaningful packet for us
        return null;
    }
    const packetId = data[0];

    switch (packetId) {
        case PACKET_TYPES.OPTION_CHAIN:
            try {
                const decodedData = decodeOptionChain(data.slice(1));
                return {
                    kind: 'OPTION_CHAIN',
                    packetId: packetId,
                    ...decodedData
                };
            } catch (error) {
                console.error('Error decoding OPTION_CHAIN packet:', error);
                return null;
            }

        // --- NEW: Handle other packet types to improve logging ---
        case PACKET_TYPES.QUOTE:
            // We don't need to decode this for now, just acknowledge it.
            return { kind: 'QUOTE', packetId: packetId, payload: 'Binary Quote Data' };

        case PACKET_TYPES.UNDERLYING_STATS:
            // We don't need to decode this for now, just acknowledge it.
            return { kind: 'UNDERLYING_STATS', packetId: packetId, payload: 'Stats Data' };
        
        default:
            // console.warn(`Unknown packet ID received: ${packetId}`);
            return null;
    }
}

module.exports = { decode };