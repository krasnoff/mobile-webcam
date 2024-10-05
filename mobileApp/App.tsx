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
  const pc = useRef<RTCPeerConnection | null>(null);

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
      pc.current = new RTCPeerConnection();

      // Add all media tracks (audio + video) to the connection
      stream.getTracks().forEach(track => {
        pc.current?.addTrack(track, stream);
      });

      // Set up the connection logic (negotiation, ice candidates, etc.)
      // You would typically add signaling here
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  }

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
