import { WebSocketServer } from 'ws';

console.log('websocket app');

// Store connections (you can extend this to multiple peers if needed)
let senderSocket = null;
let receiverSocket = null;

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', function connection(ws) {
    ws.on('message', function message(data) {
      const parsedMessage: any = JSON.parse(data);
      
      // If the sender connects, store the socket
      if (parsedMessage.type === 'offer') {
        senderSocket = ws;
        console.log('Received SDP offer from sender');

        // Forward the offer to the receiver
        if (receiverSocket) {
          receiverSocket.send(data);
        }
      }

      // If the receiver connects and sends an SDP answer
      if (parsedMessage.type === 'answer') {
        receiverSocket = ws;
        console.log('Received SDP answer from receiver');
        
        // Forward the answer to the sender
        if (senderSocket) {
          senderSocket.send(data);
        }
      }

      // Handle ICE candidates (optional but necessary for most real-world connections)
      if (parsedMessage.type === 'candidate') {
        // Forward ICE candidates between peers
        if (ws === senderSocket && receiverSocket) {
          receiverSocket.send(data);
        } else if (ws === receiverSocket && senderSocket) {
          senderSocket.send(data);
        }
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      if (ws === senderSocket) senderSocket = null;
      if (ws === receiverSocket) receiverSocket = null;
    });
  
    ws.send('websocket connection successful');
});