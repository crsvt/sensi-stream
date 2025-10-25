# sensi-stream

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

A modern, cross-platform Node.js tool for streaming real-time options chain data from Sensibull.

This project provides a stable and efficient command-line interface to connect to Sensibull's undocumented WebSocket API. It decodes the complex binary data stream in real-time and saves the options chain information as structured, human-readable JSON files, enabling developers and traders to build custom analysis tools and trading algorithms.

---

### Key Features

-   **Real-time Data**: Captures live options chain data, including prices, greeks, and OI.
-   **Flexible Configuration**: Easily configure instruments and expiry types via a simple `config.js` file—no more hardcoding.
-   **Cross-Platform**: Built to run flawlessly on Windows, macOS, and Linux.
-   **Modern & Maintainable**: A complete refactor with a clean, modular architecture for easy extension.
-   **Efficient & Reliable**: Uses the battle-tested `pako` library for fast zlib decompression.
-   **File-based Output**: Saves data in a simple, accessible JSON format in the `/data` directory.
-   **Lightweight**: Minimal dependencies, focused on performance and stability.

### Acknowledgements

This project stands on the shoulders of a giant. It is a complete rewrite and modernization inspired by the original reverse-engineering work done by **[studiogangster](https://github.com/studiogangster)** in his groundbreaking repository: **[sensibull-realtime-options-api-ingestor](https://github.com/studiogangster/sensibull-realtime-options-api-ingestor)**.

Full credit for deciphering the WebSocket protocol and initial data structures goes to him. This version aims to honor that work by providing a more robust, maintainable, and accessible implementation.

---

### Getting Started

#### Prerequisites

-   [Node.js](https://nodejs.org/) (v16.x or newer is recommended)

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
    Before your first run, open the `config.js` file in the main directory and customize your settings. By default, the tool tracks NIFTY for the nearest weekly expiry.

    ```javascript
    // config.js
    module.exports = {
      // --- Instrument Settings ---
      // Set to true to track an instrument, false to disable.
      track_nifty: true,
      track_banknifty: false,

      // --- Expiry Settings ---
      // The application will track the closest expiry from all enabled types.
      track_weekly_expiry: true,
      track_monthly_expiry: false,
    };
    ```

2.  **Run the application:**
    ```bash
    npm start
    ```

The tool will connect to the WebSocket and begin streaming data based on your configuration. You will see real-time summary updates in your console, and the corresponding JSON files will be created in the `/data` directory.

---

### Project Roadmap & To-Do

This project aims to evolve into a powerful tool for traders. The following features are planned for future releases. Contributions are highly welcome!

#### Current To-Do List

-   [x] **Improve Configuration**: Allow instruments and settings to be configured via a `.env` file or config file instead of hardcoding.
-   [x] **Enhance Error Handling**: Implement more resilient WebSocket connection logic with automatic retries.
-   [ ] **Optimize Data Storage**: Move from simple JSON overwrites to a more performant data-appending mechanism or database integration.
-   [ ] **Add More Data Sources**: Decode other packet types from the WebSocket, such as `UNDERLYING_STATS` and `QUOTE`.
-   [ ] **Web-based Dashboard**: Create a simple web interface for visualizing the real-time data.

#### Future Integrations

-   [ ] **Database Integration**: Add support for streaming data directly into **ElasticSearch** or a time-series database like InfluxDB.
-   [ ] **Google Sheets Integration**: Provide a way to push live data directly into a Google Sheet for easy analysis.
-   [ ] **AI-Powered Signals**: Develop a module to analyze the data stream and generate potential CALL/PUT signals based on predefined patterns or models.
-   [ ] **Zerodha Integration**: The ultimate goal is to integrate the **Zerodha Kite Connect API** to enable fully automated algorithmic trading and scalping based on the data ingested by this tool.

---

### How It Works

-   **`config.js`**: The main configuration file where you set which instruments and expiries to track.
-   **`src/index.js`**: The main application entry point. It reads `config.js` and starts the connection.
-   **`src/websocketClient.js`**: Manages the WebSocket lifecycle, subscriptions, and message handling.
-   **`src/dataDecoder.js`**: Responsible for decoding the binary WebSocket messages into structured JSON.
-   **`src/utils.js`**: Contains helper functions for calculating weekly and monthly expiry dates.

### Contributing

We welcome contributions of all kinds! If you have an idea for a new feature, a bug fix, or a way to improve the documentation, please open an issue to discuss it or submit a pull request.

### License

This project is licensed under the **MIT License**. See the [LICENSE.md](LICENSE.md) file for details.