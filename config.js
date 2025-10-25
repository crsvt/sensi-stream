// =================================================================
// Sensi-Stream Configuration
// =================================================================

module.exports = {
  // --- Instrument Settings ---
  // Set to true to track an instrument, false to disable.
  track_nifty: true,
  track_banknifty: false,

  // --- Expiry Settings ---
  // By default, we track the nearest weekly expiry.
  // You can enable monthly expiries as well. The application will track the
  // closest expiry date from all enabled types.
  track_weekly_expiry: true,
  track_monthly_expiry: false,

  // --- Advanced Settings ---
  // You generally don't need to change these.
  tokens: {
    nifty: 256265,
    banknifty: 260105,
  },
  
  // The directory where JSON data files will be saved.
  data_directory: './data',
};