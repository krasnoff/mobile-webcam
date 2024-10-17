// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Relay signaling messages to all connected clients except sender
    console.log('message')

    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

console.log('WebSocket signaling server running on ws://localhost:3000');