// src/aiAnalyzer.js

const https = require('https');
const config = require('../config');
const { getContext } = require('./contextStore');
const { getData } = require('./dataStore');
const { getSettings } = require('./settingsStore');

let currentKeyIndex = 0;

function getTopStrikes(chain, optionType, key, count = 3) {
  return Object.entries(chain)
    .filter(([, data]) => data[optionType] && data[optionType][key] > 0)
    .sort(([, a], [, b]) => b[optionType][key] - a[optionType][key])
    .slice(0, count)
    .map(([strike, data]) => ({
      strike: parseInt(strike),
      value: data[optionType][key],
    }));
}

function summarizeDataForAI(payload, previousPayload) {
  if (!payload || !payload.chain) { return null; }
  const { future_price, atm_strike, pcr, chain } = payload;
  
  let priceTrend = 'Stable';
  if (previousPayload) {
      const priceChange = payload.future_price - previousPayload.future_price;
      if (priceChange > 0.5) priceTrend = `Rising (${priceChange.toFixed(2)})`;
      if (priceChange < -0.5) priceTrend = `Falling (${priceChange.toFixed(2)})`;
  }
  const topCallOI = getTopStrikes(chain, 'call', 'oi', 1)[0] || { strike: 'N/A' };
  const topPutOI = getTopStrikes(chain, 'put', 'oi', 1)[0] || { strike: 'N/A' };

  return `
**Current Market Data Summary:**
- Future Price: ${future_price.toFixed(2)} (ATM Strike: ${atm_strike})
- Price Trend (5min): ${priceTrend}
- PCR: ${pcr.toFixed(2)}
- Highest Call OI (Resistance): Strike ${topCallOI.strike}
- Highest Put OI (Support): Strike ${topPutOI.strike}
`;
}

async function makeApiRequest(prompt) {
  const { openrouter_api_keys, model_name } = config.ai_settings;
  if (!openrouter_api_keys || openrouter_api_keys.length === 0 || openrouter_api_keys[0].includes('YOUR_')) {
    throw new Error("No valid OpenRouter API keys found in config.js.");
  }

  const postData = JSON.stringify({
    model: model_name,
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  const maxRetries = openrouter_api_keys.length;
  for (let i = 0; i < maxRetries; i++) {
    const apiKey = openrouter_api_keys[currentKeyIndex];
    
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Sensi-Stream',
      },
    };

    try {
      const responseText = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              if (res.statusCode >= 400) {
                const errorMessage = response.error ? response.error.message : data;
                reject(new Error(errorMessage));
              } else {
                resolve(response.choices[0].message.content);
              }
            } catch (e) {
              reject(new Error('Failed to parse API response.'));
            }
          });
        });
        req.on('error', (e) => reject(new Error(`Problem with API request: ${e.message}`)));
        req.write(postData);
        req.end();
      });
      return responseText;
    } catch (error) {
      if (error.message.includes('Rate limit exceeded')) {
        console.warn(`⚠️ API Key #${currentKeyIndex + 1} is rate-limited. Trying next key...`);
        currentKeyIndex = (currentKeyIndex + 1) % openrouter_api_keys.length;
      } else {
        throw error; // Re-throw other errors
      }
    }
  }
  throw new Error("All OpenRouter API keys are rate-limited.");
}

async function analyzeData() {
    const { payload, previousPayload } = getData();
    if (!payload) {
        console.log("⚠️ AI analysis skipped: No market data available.");
        return null;
    }
    console.log(`🤖 Generating new general market analysis...`);
    
    const { isHybridMode } = getSettings();
    const userContext = getContext();
    const optionsSummary = summarizeDataForAI(payload, previousPayload);

    let finalSummary = optionsSummary;
    if (isHybridMode && userContext.trim()) {
        finalSummary = `${optionsSummary}\n**External Market Context (Provided by User):**\n${userContext.trim()}`;
    }

    // --- MODIFIED PROMPT ---
    const prompt = `
You are an expert, quantitative trading signal generator for the Nifty 50 index. Your output MUST be concise, structured, and immediately actionable. Avoid all long paragraphs and qualitative discussion.

${finalSummary}

---
**Your Task:**
Based on the data, provide the following trading signal. All price levels must be for the UNDERLYING ASSET (the Future Price), not the option premium.

*   **Strategy:** [Buy Calls / Buy Puts / Neutral - Avoid Trading]
*   **Entry Zone:** [Provide a tight 10-15 point price range for the Future Price]
*   **Strike Choice:** [Recommend the single best near-the-money strike]
*   **Stop-Loss:** [A specific Future Price level]
*   **Target 1:** [A specific Future Price level]
*   **Target 2:** [A specific Future Price level]
*   **Exit Guideline:** [Provide a brief, condition-based exit rule. e.g., "Exit if not in profit within 90 minutes," or "Exit if PCR crosses above 1.0"]
*   **Confidence:** [High / Medium / Low]
*   **Core Rationale (Brief):** [A single, powerful sentence summarizing the reason. e.g., "Based on bullish PCR confirming technical support breakout."]`;

    try {
        const reportText = await makeApiRequest(prompt);
        let strategy = 'NEUTRAL';
        if (reportText.toLowerCase().includes('buy calls')) strategy = 'BULLISH';
        else if (reportText.toLowerCase().includes('buy puts')) strategy = 'BEARISH';
        return { reportText, strategy };
    } catch (error) {
        console.error('❌ AI Error:', error.message);
        return null;
    }
}

// --- MODIFIED: This function now enforces and parses a structured JSON output ONLY ---
async function analyzePosition(position) {
    const { payload, previousPayload } = getData();
    if (!payload) {
        console.log("⚠️ Position analysis skipped: No market data available.");
        return null;
    }
    console.log(`🤖 Generating new analysis for live position...`);

    const optionsSummary = summarizeDataForAI(payload, previousPayload);
    const currentLTP = payload.chain[position.strikePrice]?.[position.tradeType.toLowerCase()]?.last_price || 'N/A';
    
    let pnlStatus = 'At Breakeven';
    if (currentLTP !== 'N/A') {
        if (currentLTP > position.entryPrice) pnlStatus = 'Profitable';
        if (currentLTP < position.entryPrice) pnlStatus = 'In Loss';
    }

    const prompt = `
You are an expert quantitative trading analyst. Your task is to provide a technical analysis of a live options trade.

**1. User's Live Position:**
*   Trade Type: **${position.tradeType}**
*   Strike Price: **${position.strikePrice}**
*   User's Entry Price: **${position.entryPrice}**
*   Current P&L Status: **${pnlStatus}**

**2. ${optionsSummary.trim()}**

**3. Your Analytical Task:**
Your **ONLY** output must be a single, valid JSON object. This JSON object must contain the key metrics for the live monitor.
**Crucially, all price levels for Stop-Loss and Targets must be for the UNDERLYING ASSET (the Future Price), not the option premium.**

**JSON Output Format:**
{
  "thesis_confirmation": "[Yes/No/Weakening/Contradicted]",
  "stop_loss_underlying": [Underlying Price as a number],
  "target_1_underlying": [Underlying Price as a number],
  "target_2_underlying": [Underlying Price as a number]
}
`;

    try {
        const reportText = await makeApiRequest(prompt);
        
        // --- NEW PARSING LOGIC: Find and parse the JSON block ---
        const jsonMatch = reportText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const jsonString = jsonMatch[0];
            let structuredData;
            try {
                structuredData = JSON.parse(jsonString);
            } catch (e) {
                console.error('❌ Failed to parse JSON from AI response:', e);
                return `**Error:** The AI returned an invalid JSON format. Please try again. Raw response: \n\n${reportText}`;
            }
            
            // Combine the structured data into a simple, focused report
            const structuredSummary = `
*   **Thesis Confirmation:** ${structuredData.thesis_confirmation || 'N/A'}
*   **Stop-Loss (Underlying):** ${structuredData.stop_loss_underlying || 'N/A'}
*   **Target 1 (Underlying):** ${structuredData.target_1_underlying || 'N/A'}
*   **Target 2 (Underlying):** ${structuredData.target_2_underlying || 'N/A'}
`;
            // Return the simple, structured report
            return structuredSummary; 
        }
        
        // Fallback if no JSON is found
        return reportText;
    } catch (error) {
        console.error('❌ AI Position Analysis Error:', error.message);
        return `**Error:** Could not generate position analysis. The AI provider returned an error. This may be a temporary issue.`;
    }
}

module.exports = { analyzeData, analyzePosition };