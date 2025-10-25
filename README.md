# Sensi-Stream

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

A modern, cross-platform Node.js tool for streaming real-time options chain data from Sensibull and visualizing it in a powerful, live-updating web dashboard.

This project provides a stable and efficient command-line tool that connects to Sensibull's undocumented WebSocket API, decodes the complex binary data stream in real-time, and presents it in a feature-rich web interface. The dashboard automatically analyzes key metrics to generate market sentiment signals, helping traders make more informed decisions.

---

### Key Features

-   **Real-time Web Dashboard**: No more reading JSON files! The tool automatically opens a dashboard in your browser to visualize key metrics (Future Price, ATM Strike, PCR, IV) in a clean, grid-based layout.
-   **Automated Sentiment Analysis**: The dashboard analyzes the Put-Call Ratio (PCR) in real-time to generate a clear market sentiment signal (Bullish, Bearish, or Neutral), suggesting whether to focus on CALLs or PUTs.
-   **Live & On-Demand Data**: The dashboard updates in real-time during market hours. When the market is closed, it serves the last available data, allowing for analysis anytime.
-   **Cross-Platform & Auto-Open**: Built to run flawlessly on Windows, macOS, and Linux. It automatically launches the dashboard upon starting.
-   **Flexible Configuration**: Easily configure instruments (NIFTY, BANKNIFTY) and expiry types (weekly, monthly) via a simple `config.js` file.
-   **Efficient & Reliable**: Uses the battle-tested `pako` library for fast zlib decompression and includes robust auto-reconnect logic for the WebSocket connection.

### Acknowledgements

This project stands on the shoulders of a giant. It is a complete rewrite and modernization inspired by the original reverse-engineering work done by **[studiogangster](https://github.com/studiogangster)** in his groundbreaking repository: **[sensibull-realtime-options-api-ingestor](https://github.com/studiogangster/sensibull-realtime-options-api-ingestor)**.

Full credit for deciphering the WebSocket protocol and initial data structures goes to him. This version aims to honor that work by providing a more robust, maintainable, and accessible implementation.

---

### Getting Started

#### Prerequisites

-   [Node.js](https://nodejs.org/) (v16.x or newer is recommended)
-   NPM (comes with Node.js)

#### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/crsvt/sensi-stream.git
    cd sensi-stream
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Usage

1.  **Configure Your Settings:**
    Before your first run, open the `config.js` file and customize your settings. By default, the tool tracks NIFTY for the nearest weekly expiry.

    ```javascript
    // config.js
    module.exports = {
      // Set to true to track an instrument, false to disable.
      track_nifty: true,
      track_banknifty: false,

      // The application will track the closest expiry from all enabled types.
      track_weekly_expiry: true,
      track_monthly_expiry: false,
    };
    ```

2.  **Run the application:**
    ```bash
    npm start
    ```

    Your default web browser will automatically open the Sensi-Stream Dashboard at `http://localhost:3000`. Your terminal will show detailed connection logs, while the dashboard will display the live analytical data.

---

### Project Roadmap & To-Do

This project aims to evolve into a powerful tool for traders. The following features are planned for future releases. Contributions are highly welcome!

#### Current To-Do List

-   [x] **Improve Configuration**: Allow instruments and settings to be configured via a `.env` file or config file instead of hardcoding.
-   [x] **Enhance Error Handling**: Implement more resilient WebSocket connection logic with automatic retries.
-   [x] **Web-based Dashboard**: Implemented a dashboard with real-time updates via WebSockets and automated sentiment analysis.
-   [x] **Add More Data Sources**: Decode other packet types from the WebSocket, such as `UNDERLYING_STATS` and `QUOTE`.
-   [ ] **Optimize Data Storage**: Move from simple JSON overwrites to a more performant data-appending mechanism or database integration.

#### Future Integrations

-   [ ] **Database Integration**: Add support for streaming data directly into **ElasticSearch** or a time-series database like InfluxDB.
-   [ ] **Google Sheets Integration**: Provide a way to push live data directly into a Google Sheet for easy analysis.
-   [ ] **AI-Powered Signals**: Develop a module to analyze the data stream and generate potential CALL/PUT signals based on predefined patterns or models.
-   [ ] **Zerodha Integration**: The ultimate goal is to integrate the **Zerodha Kite Connect API** to enable fully automated algorithmic trading and scalping based on the data ingested by this tool.

---

### How It Works

-   **`config.js`**: The main configuration file where you set which instruments and expiries to track.
-   **`src/index.js`**: The main application entry point. It reads `config.js`, starts the web server, and initiates the WebSocket connection.
-   **`src/websocketClient.js`**: Manages the WebSocket lifecycle to Sensibull, subscriptions, and message handling. It now also broadcasts data to the dashboard.
-   **`src/dataDecoder.js`**: Responsible for decoding the binary WebSocket messages into structured JSON.
-   **`src/utils.js`**: Contains helper functions for calculating weekly and monthly expiry dates.
-   **`src/webServer.js`**: Initializes an Express server and a local WebSocket to broadcast data to the web dashboard.
-   **`public/index.html`**: The frontend dashboard page that visualizes the data and displays analytical signals.

### Contributing

We welcome contributions of all kinds! If you have an idea for a new feature, a bug fix, or a way to improve the documentation, please open an issue to discuss it or submit a pull request.

### License

This project is licensed under the **MIT License**. See the [LICENSE.md](LICENSE.md) file for details.