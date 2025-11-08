// src/webServer.js

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { setContext } = require('./contextStore');
const { setSettings } = require('./settingsStore');
const { analyzeData, analyzePosition } = require('./aiAnalyzer');
const { getData } = require('./dataStore');

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let latestDataFilePath = '';
let isServerRunning = false;

// --- MODIFIED: State to manage which monitor is active ---
let activeMonitor = 'GENERAL'; // 'GENERAL' or 'POSITION'
let generalAIStrategy = 'NEUTRAL';
let userTradeDirection = 'NEUTRAL';

const PCR_BULLISH_THRESHOLD = 0.7;
const PCR_BEARISH_THRESHOLD = 1.0;


app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

app.get('/api/data', (req, res) => {
    if (fs.existsSync(latestDataFilePath)) {
        const data = fs.readFileSync(latestDataFilePath, 'utf-8');
        res.json(JSON.parse(data));
    } else {
        res.json({ message: "No data received yet. Waiting for the first update..." });
    }
});

app.post('/api/context', (req, res) => {
    const { context } = req.body;
    if (typeof context === 'string') {
        setContext(context);
        res.status(200).json({ message: 'Context saved successfully.' });
    } else {
        res.status(400).json({ message: 'Invalid context provided.' });
    }
});

app.post('/api/settings', (req, res) => {
    const { isHybridMode } = req.body;
    if (typeof isHybridMode === 'boolean') {
        setSettings({ isHybridMode });
        res.status(200).json({ message: 'Settings saved.' });
    } else {
        res.status(400).json({ message: 'Invalid settings.' });
    }
});

// --- MODIFIED: This now sets the monitor to 'GENERAL' mode ---
app.post('/api/analyze-now', async (req, res) => {
    console.log('⚡ Received on-demand analysis request from client.');
    try {
        const analysisResult = await analyzeData();
        if (analysisResult && analysisResult.reportText) {
            generalAIStrategy = analysisResult.strategy;
            activeMonitor = 'GENERAL'; // Set monitor to general mode
            console.log(`✅ New AI Strategy set to: ${generalAIStrategy}. Monitor set to GENERAL.`);
            broadcastAIAnalysis(analysisResult.reportText);
            runConfluenceCheck();
            res.status(200).json({ message: 'Analysis triggered and broadcasted.' });
        } else {
            throw new Error('Analysis returned null.');
        }
    } catch (error) {
        console.error('Analysis Error:', error.message);
        res.status(500).json({ message: 'Analysis could not be run. Check server logs.' });
    }
});

// --- MODIFIED: This now sets the monitor to 'POSITION' mode ---
app.post('/api/analyze-position', async (req, res) => {
    console.log('⚡ Received on-demand position analysis request.');
    const positionDetails = req.body;

    try {
        const analysisText = await analyzePosition(positionDetails);
        if (analysisText) {
            userTradeDirection = positionDetails.tradeType === 'Call' ? 'BULLISH' : 'BEARISH';
            activeMonitor = 'POSITION'; // Set monitor to position mode
            console.log(`✅ Monitoring user position: ${userTradeDirection}. Monitor set to POSITION.`);
            broadcastPositionAnalysis(analysisText);
            runConfluenceCheck();
            res.status(200).json({ message: 'Position analysis triggered.' });
        } else {
            throw new Error('Position analysis returned null.');
        }
    } catch (error) {
        console.error('Position Analysis Error:', error.message);
        res.status(500).json({ message: 'Position analysis could not be run. Check server logs.' });
    }
});


wss.on('connection', (ws) => {
    console.log('✅ Web client connected to the dashboard.');
    ws.on('close', () => {
        console.log('🔌 Web client disconnected.');
    });
});

// --- MODIFIED: This function now handles both monitoring modes ---
function runConfluenceCheck() {
    const strategyToCheck = activeMonitor === 'POSITION' ? userTradeDirection : generalAIStrategy;
    if (strategyToCheck === 'NEUTRAL') return;

    const { payload } = getData();
    if (!payload || !payload.pcr) return;

    const pcr = payload.pcr;
    let liveMarketSentiment = 'NEUTRAL';
    if (pcr < PCR_BULLISH_THRESHOLD) liveMarketSentiment = 'BULLISH';
    else if (pcr > PCR_BEARISH_THRESHOLD) liveMarketSentiment = 'BEARISH';

    let status, message;
    if (strategyToCheck === liveMarketSentiment) {
        status = 'CONFLUENCE';
        message = `Live data confirms your ${strategyToCheck} position.`;
    } else if (liveMarketSentiment === 'NEUTRAL') {
        status = 'CAUTION';
        message = `Market momentum is neutral against your ${strategyToCheck} position.`;
    } else {
        status = 'DIVERGENCE';
        message = `Live data is moving against your ${strategyToCheck} position!`;
    }

    const confluencePayload = {
        type: 'confluence_status',
        content: {
            status, 
            message,
            strategy: strategyToCheck,
            monitorType: activeMonitor, // 'GENERAL' or 'POSITION'
            updateTimestamp: Date.now()
        }
    };
    const dataString = JSON.stringify(confluencePayload);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(dataString);
        }
    });
}

function startServer() {
    server.listen(PORT, () => {
        isServerRunning = true;
        console.log(`✅ Web dashboard is live at http://localhost:${PORT}`);
        setInterval(runConfluenceCheck, 30000); 
        console.log('✅ AI Confluence Monitor is now active.');
    });
}

function broadcastData(newData, filePath) {
    if (!isServerRunning) return;
    latestDataFilePath = filePath;
    const payload = { type: 'market_data', content: newData };
    const dataString = JSON.stringify(payload);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(dataString);
        }
    });
}

function broadcastAIAnalysis(analysis) {
    if (!isServerRunning) return;
    const payload = {
        type: 'ai_analysis',
        content: analysis,
        analysisTimestamp: Date.now()
    };
    const dataString = JSON.stringify(payload);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(dataString);
        }
    });
}

function broadcastPositionAnalysis(analysis) {
    if (!isServerRunning) return;
    const payload = {
        type: 'position_analysis',
        content: analysis,
        analysisTimestamp: Date.now()
    };
    const dataString = JSON.stringify(payload);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(dataString);
        }
    });
}

module.exports = { startServer, broadcastData, broadcastAIAnalysis };