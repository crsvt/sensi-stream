# Sensi-Stream

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

A **modern, cross-platform Node.js tool** for streaming real-time **options chain data from Sensibull** and visualizing it through an interactive, AI-powered dashboard.

Sensi-Stream connects to Sensibull’s undocumented WebSocket API, decodes the binary data stream in real time, and presents it in a futuristic web interface.  
It integrates an advanced **Hybrid AI Analysis Engine** that combines live options data with user-provided market context to generate actionable insights via the **OpenRouter API**.

---

## 🚀 Key Features

### 🔹 Interactive Hybrid AI Analysis
Go beyond simple options data.  
Use external AI models (like **Grok**, **Gemini**, or **ChatGPT**) to fetch global cues, patterns, and news.  
Feed that summary into Sensi-Stream — its internal AI synthesizes this with real-time data for a **complete, context-aware market view**.

### 🧠 NEW: Live AI Strategy Monitor
After generating an AI report, a **Confluence & Divergence Monitor** activates.  
It constantly checks if the live market data **confirms or contradicts** the AI strategy — giving instant alerts on potential market shifts.  
> 💡 Works locally — **no additional AI calls.**

### ⚡ On-Demand AI Reports
Instantly generate fresh AI-based market reports with the “**Generate AI Report**” button.  
Perfect for **intraday traders** needing fast, context-rich insights.

### 💻 Real-Time Web Dashboard
A stunning **glassmorphism UI** shows all essential metrics —  
**Future Price**, **ATM Strike**, **PCR**, **IV**, and more — in a responsive, grid-based layout.

### 🧩 Improved UI
AI reports now appear in **collapsible cards**, keeping your workspace tidy while keeping insights one click away.

### 📊 Automated Sentiment Analysis
Analyzes the **Put-Call Ratio (PCR)** in real time to signal **Bullish**, **Bearish**, or **Neutral** sentiment.

### 🧠 Cross-Platform & Auto-Launch
Runs seamlessly on **Windows**, **macOS**, and **Linux**, auto-launching the dashboard on start.

---

## 🙌 Acknowledgements

This project builds on the groundbreaking work by **[studiogangster](https://github.com/studiogangster/sensibull-realtime-options-api-ingestor)**, who first reverse-engineered the Sensibull WebSocket protocol.  
Sensi-Stream is a **modernized rewrite**, designed to be robust, modular, and developer-friendly — honoring that original work.

---

## 🧩 Getting Started

### Prerequisites
- **Node.js** (v16.x or later)
- **npm** (included with Node.js)

---

### Installation

```bash
git clone https://github.com/crsvt/sensi-stream.git
cd sensi-stream
npm install
```

---

### Configuration

Before your first run, open **`config.js`** and adjust your preferences.

#### 🎯 Instrument & Expiry Settings
```js
// config.js
module.exports = {
  track_nifty: true,
  track_banknifty: false,

  track_weekly_expiry: true,
  track_monthly_expiry: false,
  // ...
};
```

#### 🤖 AI Analysis Settings
To enable AI features, configure your **OpenRouter API keys**:

```js
// config.js -> ai_settings
ai_settings: {
  enable_ai_analysis: true,
  openrouter_api_keys: [
    'YOUR_FIRST_OPENROUTER_API_KEY_HERE',
    'YOUR_SECOND_OPENROUTER_API_KEY_HERE',
  ],
  model_name: 'qwen/qwen-2.5-72b-instruct:free',
},
```

> 🔑 Get your API keys from [OpenRouter.ai](https://openrouter.ai) (free tier available).

---

## ▶️ Usage

Start the app:
```bash
npm start
```

Your browser will open the dashboard automatically at  
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧠 Recommended Workflow: Hybrid AI Analysis

### **Step 1: Get External Context**
Use an AI with internet access (like Grok, Gemini, or ChatGPT) and run this prompt:

```
You are an expert financial analyst. Your sole task is to provide a concise, factual summary of the current market context for the Indian Nifty 50 index. Do not give any recommendations.

Date: October 30th, 2025

1. Global & Pre-Market Cues:
   - Status of US futures (S&P 500 `ES`, Nasdaq `NQ`)
   - Performance of key Asian markets (Nikkei, Hang Seng)
   - Current GIFT Nifty trend
   - Classify sentiment: Positive / Negative / Mixed

2. Indian Market News & Events:
   - Top 3–5 India-specific financial news headlines
   - Any key data releases (e.g., RBI meet, inflation)
   - Classify domestic sentiment: Positive / Negative / Neutral

3. Intraday Technical View:
   - Describe the intraday trend (5m/15m chart)
   - List key support & resistance levels

4. Volatility & Institutional Context:
   - Trend of India VIX
   - FII/DII net investment data (previous session)

Provide output as a single, formatted block of text.
```

### **Step 2: Input Context**
Paste the output summary into the Sensi-Stream dashboard and click **“Generate AI Report.”**

### **Step 3: Review the Report**
A comprehensive **AI Analyst Report** will appear — your baseline strategy.

### **Step 4: Monitor the Live Strategy**
Watch the color-coded status bar:
- 🟢 **Strategy Confirmed:** Market aligns with AI outlook.
- 🟡 **Momentum Slowing:** Trend weakening — watch closely.
- 🔴 **STRATEGY ALERT!:** Market diverging — caution advised.

---

## 🧩 Project Structure

| File | Description |
|------|--------------|
| **src/index.js** | Main entry point |
| **src/websocketClient.js** | Handles WebSocket data ingestion |
| **src/aiAnalyzer.js** | Builds prompts, queries OpenRouter AI, extracts strategy tags |
| **src/webServer.js** | Hosts Express server + live monitor logic |
| **src/stores/** | State management for data, context, and settings |
| **public/index.html** | Interactive web dashboard |

---

## 🤝 Contributing

Contributions are welcome!  
Open an issue to discuss your ideas or submit a pull request.

---

## 📜 License

This project is licensed under the **MIT License**.  
See [`LICENSE.md`](LICENSE.md) for full details.
