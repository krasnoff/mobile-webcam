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
import RNFetchBlob from 'rn-fetch-blob';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function App(): React.JSX.Element {
  const [localStream, setLocalStream] = useState<any>(null);
  const lc = useRef<RTCPeerConnection | null>(null);

  // Helper function to convert Blob to string using async/await
  const blobToString = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const utf8String = new TextDecoder('utf-8').decode(arrayBuffer);
        resolve(utf8String);
      };
  
      reader.onerror = (error) => {
        reject(error);
      };
  
      reader.readAsArrayBuffer(blob);
    });
  }

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
    // let message = JSON.parse(e.data);
    const temp = await blobToString(e as any);
    console.log('Received SDP offer from receiver...', temp);

    // if (message.type === 'answer') {
    //   // have to check if I recieve a remote description
    //   console.log('Received SDP offer from sender');

    //   // Set the offer as the remote description
    //   await lc.current?.setRemoteDescription(new RTCSessionDescription(message));

    //   // Create an SDP answer
    //   // const answer = await lc.current?.createAnswer();
    //   // await lc.current?.setLocalDescription(answer);

    //   // Send the SDP answer back to the sender
    //   // ws.send(JSON.stringify({ type: 'answer', sdp: answer.sdp }));
    // }

    // // Handle ICE candidates (if applicable)
    // if (message.type === 'candidate') {
    //   try {
    //     console.log('this is ice candidate', message.candidate);
    //     // TODO - have to check if I have a remote description
    //     await lc.current?.addIceCandidate(new RTCIceCandidate(message.candidate));
    //   } catch (e) {
    //     console.error('Error adding received ICE candidate', e);
    //   }
    // }
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
