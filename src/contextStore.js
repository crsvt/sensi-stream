// src/contextStore.js

let userContext = '';

function setContext(context) {
  console.log('📝 New user context has been saved.');
  userContext = context;
}

function getContext() {
  return userContext;
}

module.exports = { setContext, getContext };