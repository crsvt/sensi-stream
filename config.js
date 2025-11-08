// =================================================================
// Sensi-Stream Configuration
// =================================================================

module.exports = {
  // --- Instrument Settings ---
  // Set to true to track an instrument, false to disable.
  track_nifty: true,
  track_banknifty: false,

  // --- Expiry Settings ---
  // The application will track the closest expiry from all enabled types.
  track_weekly_expiry: true,
  track_monthly_expiry: false,

  // --- Dashboard Settings ---
  dashboard_settings: {
    // Set to true to enable the web dashboard feature.
    // If false, the app will run in the original console-only mode.
    enable_dashboard: true,

    // If the dashboard is enabled, set to true to automatically open it
    // in your default web browser when the application starts.
    auto_open_browser: true,
  },

  // --- MODIFIED: AI Analyst Settings ---
  ai_settings: {
    // Set to true to enable the AI analysis feature.
    enable_ai_analysis: true,

    // Your API keys from OpenRouter.ai. Add as many as you want.
    openrouter_api_keys: [
      'YOUR_FIRST_OPENROUTER_API_KEY_HERE',
      'YOUR_SECOND_OPENROUTER_API_KEY_HERE',
    ],

    // The model to use for the analysis.
    model_name: 'qwen/qwen-2.5-72b-instruct:free',
  },

  // --- Advanced Settings ---
  // You generally don't need to change these.
  tokens: {
    nifty: 256265,
    banknifty: 260105,
  },
  
  // The directory where JSON data files will be saved.
  data_directory: './data',
};