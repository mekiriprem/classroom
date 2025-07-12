import Stomp, { Client } from 'stompjs';
import SockJS from 'sockjs-client';

interface SignalData {
  type: 'offer' | 'answer' | 'candidate';
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

interface WebRTCInstance {
  peerConnection: RTCPeerConnection | null;
  stompClient: Client | null;
  isConnecting: boolean;
  activeCode: string | null;
}

// Singleton to manage WebRTC and WebSocket instance
const webRTCInstance: WebRTCInstance = {
  peerConnection: null,
  stompClient: null,
  isConnecting: false,
  activeCode: null,
};

export const setupWebRTC = (
  code: string,
  videoRef: React.RefObject<HTMLVideoElement>,
  setLocalStream: React.Dispatch<React.SetStateAction<MediaStream | null>> | null,
  isTeacher: boolean
): void => {
  // Prevent setup if already connected or connecting for the same code
  if (webRTCInstance.isConnecting || (webRTCInstance.stompClient?.connected && webRTCInstance.activeCode === code)) {
    console.log(`WebRTC already ${webRTCInstance.isConnecting ? 'connecting' : 'connected'} for code ${code}`);
    return;
  }

  // If connected to a different code, close existing connection
  if (webRTCInstance.stompClient?.connected && webRTCInstance.activeCode !== code) {
    console.log(`Switching WebRTC connection from ${webRTCInstance.activeCode} to ${code}`);
    closeWebRTC();
  }

  webRTCInstance.isConnecting = true;
  webRTCInstance.activeCode = code;
  console.log(`Opening Web Socket for code ${code}...`);

  const configuration: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  try {
    webRTCInstance.peerConnection = new RTCPeerConnection(configuration);

    const socket = new SockJS('http://localhost:8080/ws');
    webRTCInstance.stompClient = Stomp.over(socket);

    webRTCInstance.stompClient.connect(
      {},
      () => {
        console.log('WebSocket connected');
        webRTCInstance.isConnecting = false;
        webRTCInstance.stompClient?.subscribe(`/topic/signal/${code}`, (message) => {
          try {
            const signal: SignalData = JSON.parse(message.body);
            handleSignal(signal, code);
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        });
      },
      (err) => {
        console.error('WebSocket connection failed:', err);
        webRTCInstance.isConnecting = false;
        webRTCInstance.activeCode = null;
      }
    );

    if (isTeacher) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (setLocalStream) setLocalStream(stream);
          stream.getTracks().forEach((track) => webRTCInstance.peerConnection?.addTrack(track, stream));
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          createOffer(code);
        })
        .catch((err) => console.error('Failed to get media stream:', err));
    } else {
      webRTCInstance.peerConnection!.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
        }
      };
    }

    webRTCInstance.peerConnection!.onicecandidate = (event) => {
      if (event.candidate && webRTCInstance.stompClient?.connected) {
        webRTCInstance.stompClient.send(
          `/app/signal/${code}`,
          {},
          JSON.stringify({
            type: 'candidate',
            candidate: event.candidate,
          })
        );
      }
    };
  } catch (err) {
    console.error('Failed to setup WebRTC:', err);
    webRTCInstance.isConnecting = false;
    webRTCInstance.activeCode = null;
  }
};

const createOffer = async (code: string): Promise<void> => {
  if (!webRTCInstance.peerConnection || !webRTCInstance.stompClient?.connected) return;
  try {
    const offer = await webRTCInstance.peerConnection.createOffer();
    await webRTCInstance.peerConnection.setLocalDescription(offer);
    webRTCInstance.stompClient.send(
      `/app/signal/${code}`,
      {},
      JSON.stringify({
        type: 'offer',
        sdp: offer.sdp,
      })
    );
  } catch (err) {
    console.error('Failed to create offer:', err);
  }
};

const handleSignal = async (signal: SignalData, code: string): Promise<void> => {
  if (!webRTCInstance.peerConnection || !webRTCInstance.stompClient?.connected) return;
  try {
    if (signal.type === 'offer') {
      await webRTCInstance.peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: signal.sdp })
      );
      const answer = await webRTCInstance.peerConnection.createAnswer();
      await webRTCInstance.peerConnection.setLocalDescription(answer);
      webRTCInstance.stompClient.send(
        `/app/signal/${code}`,
        {},
        JSON.stringify({
          type: 'answer',
          sdp: answer.sdp,
        })
      );
    } else if (signal.type === 'answer') {
      await webRTCInstance.peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: signal.sdp })
      );
    } else if (signal.type === 'candidate' && signal.candidate) {
      await webRTCInstance.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  } catch (err) {
    console.error('Failed to handle signal:', err);
  }
};

export const closeWebRTC = (): void => {
  console.log('>>> DISCONNECT');
  if (webRTCInstance.peerConnection) {
    webRTCInstance.peerConnection.close();
    webRTCInstance.peerConnection = null;
  }
  if (webRTCInstance.stompClient && webRTCInstance.stompClient.connected) {
    webRTCInstance.stompClient.disconnect(() => {
      console.log('WebSocket disconnected');
    });
    webRTCInstance.stompClient = null;
  }
  webRTCInstance.isConnecting = false;
  webRTCInstance.activeCode = null;
};