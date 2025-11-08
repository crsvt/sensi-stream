// src/settingsStore.js

let settings = {
  isHybridMode: true, // Default to on
};

function setSettings(newSettings) {
  settings = { ...settings, ...newSettings };
  console.log('⚙️ AI settings updated:', settings);
}

function getSettings() {
  return settings;
}

module.exports = { setSettings, getSettings };