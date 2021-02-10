const WebSocket = require('ws');

const ws = new WebSocket('ws://192.168.0.10:8080/dvcCon', {
  perMessageDeflate: false
});