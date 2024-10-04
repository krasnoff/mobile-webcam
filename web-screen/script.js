// Create an RTCPeerConnection
const lc = new RTCPeerConnection();

// Function to get media stream from the webcam and microphone
async function getMediaStream() {
    try {
        // Request both video and audio from the user
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        // Display the video stream in a video element
        const videoElement = document.querySelector('video');
        if (videoElement) {
            videoElement.srcObject = stream;
        }

        // Add all tracks (both video and audio) to the RTCPeerConnection
        stream.getTracks().forEach(track => {
            lc.addTrack(track, stream);
        });

        // Create SDP offer after the media stream is added
        const offer = await lc.createOffer();

        // Set local description with the generated offer (SDP)
        await lc.setLocalDescription(offer);

        console.log('SDP Offer:', offer.sdp); // This is your SDP that you can send to the remote peer
        console.log('SDP Offer formatted:', JSON.stringify(offer)); // This is your SDP that you can send to the remote peer
        console.log('Tracks added to RTCPeerConnection');
    } catch (error) {
        console.error('Error accessing media devices:', error);
    }
}

getMediaStream()