const pako = require('pako');

// Constants for packet types from reverse-engineering
const PACKET_TYPES = {
    OPTION_CHAIN: 3,
    UNDERLYING_STATS: 5,
    QUOTE: 1,
};

/**
 * Decodes a binary buffer into an integer.
 * @param {Buffer} buffer The buffer to decode.
 * @returns {number} The decoded integer.
 */
function bufferToInt(buffer) {
    return buffer.readUInt32LE(0);
}

/**
 * Decodes the option chain packet.
 * @param {Buffer} data The binary data slice for this packet.
 * @returns {object} The decoded option chain data.
 */
function decodeOptionChain(data) {
    const token = bufferToInt(data.slice(0, 4));
    const expiryDateRaw = data.slice(4, 12).toString('utf-8');
    const expiry = `${expiryDateRaw.slice(0, 4)}-${expiryDateRaw.slice(4, 6)}-${expiryDateRaw.slice(6, 8)}`;
    
    // Decompress the rest of the payload
    const compressedData = data.slice(12);
    const decompressedData = pako.inflate(compressedData, { to: 'string' });
    const payload = JSON.parse(decompressedData);

    return { token, expiry, payload };
}

/**
 * Main function to decode incoming WebSocket binary messages.
 * @param {Buffer} binaryData The raw binary data from the WebSocket.
 * @returns {object|null} A structured object with the decoded data or null if unknown.
 */
function decode(binaryData) {
    const data = Buffer.from(binaryData);
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

        // Add cases for other packet types like UNDERLYING_STATS and QUOTE here if needed.
        // For now, we focus on the primary goal.

        default:
            // console.warn(`Unknown packet ID received: ${packetId}`);
            return null;
    }
}

module.exports = { decode };