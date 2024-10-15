const remoteVideo = document.getElementById('remoteVideo');
const pc = new RTCPeerConnection();

// Set up WebSocket connection to signaling server
const ws = new WebSocket('ws://localhost:3001?socket=receiver');

const isValidJSON = str => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

// Handle incoming WebSocket messages
ws.onmessage = async (event) => {
    let message = {}; 
    if (isValidJSON(event.data)) {
      message = JSON.parse(event.data);
    }
    

    if (message.type === 'offer') {
        console.log('Received SDP offer from sender');
        
        // Set the offer as the remote description
        await pc.setRemoteDescription(new RTCSessionDescription(message));

        // Create an SDP answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Send the SDP answer back to the sender
        ws.send(JSON.stringify({ type: 'answer', sdp: answer.sdp }));
    }

    // Handle ICE candidates (if applicable)
    if (message.type === 'candidate') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        } catch (e) {
          console.error('Error adding received ICE candidate', e);
        }
    }
}

// Display the remote video stream when it's available - כאן תכלס
pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
};

// Exchange ICE candidates between peers
pc.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
    }
};