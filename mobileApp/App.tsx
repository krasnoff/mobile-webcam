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
  const ws = new WebSocket('ws://192.168.1.128:3000');

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

      // WebRTC configuration
      const configuration = {
        iceServers: [
            {
            urls: 'stun:stun.l.google.com:19302'
            }
        ]
      };

      // Create a new RTCPeerConnection
      lc.current = new RTCPeerConnection(configuration);

      // Add all media tracks (audio + video) to the connection
      stream.getTracks().forEach(track => {
        lc.current?.addTrack(track, stream);
      });

      // Set up onicecandidate handler
      (lc.current as any).onicecandidate = (event: any) => {
        if (event.candidate) {
          // Send candidate to the signaling server
          ws.send(JSON.stringify({
            type: 'candidate',
            candidate: event.candidate,
          }));
        }
      };

      // Create SDP offer after the media stream is added
      const offer = await lc.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      let offerSDP = offer.sdp;
      offerSDP = offerSDP.replace('useinbandfec=1', 'useinbandfec=1;profile-level-id=42e01f'); // For VP8
      offer.sdp = offerSDP;

      // Set local description with the generated offer (SDP)
      await lc.current.setLocalDescription(offer);

      console.log('SDP Offer:', offer); // This is your SDP that you can send to the remote peer

      // Send offer to the signaling server
      ws.send(JSON.stringify({type: 'offer', offer: lc.current.localDescription}));

      

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
    //console.log('Received SDP offer from receiver...', message);

    if (message.type === 'answer') {
      // have to check if I recieve a remote description
      // console.log('Received SDP offer from sender');

      // Set the offer as the remote description
      await lc.current?.setRemoteDescription(new RTCSessionDescription(message.answer));
    } // Handle ICE candidates (if applicable)
    else if (message.type === 'candidate') {
      //console.log('this is ice candidate', message.candidate, lc.current?.remoteDescription);
      if (lc.current?.remoteDescription && lc.current?.remoteDescription.type) {
        try {
          
          await lc.current?.addIceCandidate(new RTCIceCandidate(message.candidate));
        } catch (e) {
          console.error('Error adding received ICE candidate', e);
        }
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
