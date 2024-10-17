import { WebSocketServer } from 'ws';

console.log('websocket app');

// Store connections (you can extend this to multiple peers if needed)
let senderSocket = null;
let receiverSocket = null;

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', function connection(ws, req) {
    // console.log('connection paramters', req.socket);
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const socket = urlParams.get('socket'); // '1234'
    console.log('User connected with ID:', socket);

    if (socket === 'sender') {
      senderSocket = ws;
    } else if (socket === 'receiver') {
      receiverSocket = ws;
    }

    ws.on('message', function message(data) {
      const parsedMessage: any = JSON.parse(data.toString());
            
      // If the sender connects, store the socket
      if (parsedMessage.type === 'offer') {
        
        // Forward the offer to the receiver
        if (receiverSocket) {
          receiverSocket.send(JSON.stringify({ type: 'offer', sdp: parsedMessage.sdp }));
        }
      }

      // If the receiver connects and sends an SDP answer
      if (parsedMessage.type === 'answer') {
        receiverSocket = ws;
        console.log('Received SDP answer from receiver');
        
        // Forward the answer to the sender
        if (senderSocket) {
          senderSocket.send(JSON.stringify({ type: 'answer', sdp: parsedMessage.sdp }));
        }
      }

      // Handle ICE candidates (optional but necessary for most real-world connections)
      if (parsedMessage.type === 'candidate') {
        // Forward ICE candidates between peers
        if (parsedMessage.source === 'sender') {
          receiverSocket.send(JSON.stringify({ type: 'candidate', candidate: parsedMessage.candidate }));
        } else if (parsedMessage.source === 'receiver') {
          senderSocket.send(JSON.stringify({ type: 'candidate', candidate: parsedMessage.candidate }));
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