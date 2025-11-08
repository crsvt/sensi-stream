// src/dataStore.js

let latestMarketData = {
  payload: null,
  previousPayload: null,
  expiry: null,
};

function setData(payload, previousPayload, expiry) {
  latestMarketData = { payload, previousPayload, expiry };
}

function getData() {
  return latestMarketData;
}

module.exports = { setData, getData };