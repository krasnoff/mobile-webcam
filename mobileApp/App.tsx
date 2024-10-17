/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useRef, useState } from 'react';
import type {PropsWithChildren} from 'react';
import { Button, Text, View } from 'react-native';
import { mediaDevices, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription, RTCView } from 'react-native-webrtc';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function App(): React.JSX.Element {
  const [localStream, setLocalStream] = useState<any>(null);
  const lc = useRef<RTCPeerConnection | null>(null);

  // Setup WebSocket to signaling server
  const ws = new WebSocket('ws://192.168.1.128:3001?socket=sender');

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

      // console.log('SDP Offer:', offer); // This is your SDP that you can send to the remote peer

      // Send offer to the signaling server
      ws.send(JSON.stringify(offer));

      // Set up onicecandidate handler
      (lc.current as any).onicecandidate = (event: any) => {
        if (event.candidate) {
          // Send candidate to the signaling server
          ws.send(JSON.stringify({
            type: 'candidate',
            source: 'sender',
            candidate: event.candidate,
          }));
        }
      };

    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  }

  

  ws.onopen = () => {
    
  };
  
  ws.onmessage = async (e) => {
    // a message was received
    // TODO add here
    let message = JSON.parse(e.data);

    if (message.type === 'answer') {
      // have to check if I recieve a remote description
      console.log('Received SDP offer from sender');

      // Set the offer as the remote description
      await lc.current?.setRemoteDescription(new RTCSessionDescription(message));

      // Create an SDP answer
      // const answer = await lc.current?.createAnswer();
      // await lc.current?.setLocalDescription(answer);

      // Send the SDP answer back to the sender
      // ws.send(JSON.stringify({ type: 'answer', sdp: answer.sdp }));
    }

    // Handle ICE candidates (if applicable)
    if (message.type === 'candidate') {
      try {
        console.log('this is ice candidate', message.candidate);
        // TODO - have to check if I have a remote description
        await lc.current?.addIceCandidate(new RTCIceCandidate(message.candidate));
      } catch (e) {
        console.error('Error adding received ICE candidate', e);
      }
    }
  };
  
  ws.onerror = (e) => {
    // an error occurred
    //console.log(e.message);
  };
  
  ws.onclose = (e) => {
    // connection closed
    //console.log(e.code, e.reason);
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
