/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useRef, useState } from 'react';
import type {PropsWithChildren} from 'react';
import { Button, Text, View } from 'react-native';
import { mediaDevices, RTCPeerConnection, RTCView } from 'react-native-webrtc';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function App(): React.JSX.Element {
  const [localStream, setLocalStream] = useState<any>(null);
  const lc = useRef<RTCPeerConnection | null>(null);

  // Setup WebSocket to signaling server
  const ws = new WebSocket('ws://192.168.1.128:3001');

  // Function to start the stream and add to RTCPeerConnection
  const startStream = async () => {
    try {
      // Request access to media devices (audio and video)
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          frameRate: 30,
          facingMode: 'user', // use 'environment' for rear camera
        },
      });

      // Set the local stream to display the local video
      setLocalStream(stream);

      // Create a new RTCPeerConnection
      lc.current = new RTCPeerConnection();

      // Add all media tracks (audio + video) to the connection
      stream.getTracks().forEach(track => {
        lc.current?.addTrack(track, stream);
      });

      // Create SDP offer after the media stream is added
      let sessionConstraints = {
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true,
          VoiceActivityDetection: true
        }
      };

      const offer = await lc.current.createOffer(sessionConstraints);

      // Set local description with the generated offer (SDP)
      await lc.current.setLocalDescription(offer);

      console.log('SDP Offer:', offer); // This is your SDP that you can send to the remote peer

      // Send offer to the signaling server
      ws.send(JSON.stringify(offer));

    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  }

  ws.onopen = () => {
    // connection opened
    ws.send(JSON.stringify({'sdp': 'something from mobile', 'type': 'test'})); // send a message
  };
  
  ws.onmessage = (e) => {
    // a message was received
    console.log(e.data);
  };
  
  ws.onerror = (e) => {
    // an error occurred
    console.log(e.message);
  };
  
  ws.onclose = (e) => {
    // connection closed
    console.log(e.code, e.reason);
  };

  return (
    <View style={{ flex: 1 }}>
      <Text>Hello World</Text>
      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={{ width: '100%', height: 300 }}
        />
      )}
      <Button title="Start Stream" onPress={startStream} />
    </View>
  );
}

export default App;
