const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let latestData = null; // In-memory cache for the latest data
let isServerRunning = false;

// Serve static files from a 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API endpoint now serves data from the in-memory cache
app.get('/api/data', (req, res) => {
    if (latestData) {
        res.json(latestData);
    } else {
        res.json({ message: "No data received yet. Waiting for the first update..." });
    }
});

wss.on('connection', (ws) => {
    console.log('✅ Web client connected to the dashboard.');

    // --- NEW: Immediately send the latest data to the new client ---
    if (latestData) {
        console.log('--> Sending cached data to newly connected client.');
        ws.send(JSON.stringify(latestData));
    }

    ws.on('close', () => {
        console.log('🔌 Web client disconnected.');
    });
});

function startServer(callback) {
    server.listen(PORT, () => {
        isServerRunning = true;
        console.log(`✅ Web dashboard is live at http://localhost:${PORT}`);
        if (callback) {
            callback();
        }
    });
}

// Function to broadcast new data to all connected web clients
function broadcastData(newData, filePath) {
    if (!isServerRunning) {
        return;
    }
    
    // Update the in-memory cache
    latestData = newData; 
    
    const dataString = JSON.stringify(newData); // No need for pretty-printing here
    
    // Broadcast to all currently connected clients
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(dataString);
        }
    });
}

module.exports = { startServer, broadcastData };