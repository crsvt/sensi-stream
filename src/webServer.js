// src/webServer.js

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let latestData = {}; // Store the latest data in memory
let latestDataFilePath = ''; // Keep track of the file to serve on initial load

// Serve static files from a 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API endpoint to get the last known data on page load
app.get('/api/data', (req, res) => {
    if (fs.existsSync(latestDataFilePath)) {
        const data = fs.readFileSync(latestDataFilePath, 'utf-8');
        res.json(JSON.parse(data));
    } else {
        res.json({ message: "No data received yet. Waiting for the first update..." });
    }
});

wss.on('connection', (ws) => {
    console.log('✅ Web client connected to the dashboard.');
    ws.on('close', () => {
        console.log('🔌 Web client disconnected.');
    });
});

function startServer() {
    server.listen(PORT, () => {
        console.log(`✅ Web dashboard is live at http://localhost:${PORT}`);
    });
}

// Function to broadcast new data to all connected web clients
function broadcastData(newData, filePath) {
    latestData = newData;
    latestDataFilePath = filePath; // Update the path
    const dataString = JSON.stringify(newData, null, 2);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(dataString);
        }
    });
}

module.exports = { startServer, broadcastData };