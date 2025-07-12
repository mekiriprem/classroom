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
) => {
  if (webRTCInstance.isConnecting || (webRTCInstance.stompClient?.connected && webRTCInstance.activeCode === code)) {
    return;
  }

  if (webRTCInstance.stompClient?.connected && webRTCInstance.activeCode !== code) {
    closeWebRTC();
  }

  webRTCInstance.isConnecting = true;
  webRTCInstance.activeCode = code;

  const config: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  webRTCInstance.peerConnection = new RTCPeerConnection(config);

  const socket = new SockJS('https://api.markmarketing.xyz/ws');
  webRTCInstance.stompClient = Stomp.over(socket);

  webRTCInstance.stompClient.connect({}, () => {
    webRTCInstance.isConnecting = false;

    webRTCInstance.stompClient?.subscribe(`/topic/signal/${code}`, (message) => {
      const signal: SignalData = JSON.parse(message.body);
      handleSignal(signal, code);
    });

    if (isTeacher) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        if (setLocalStream) setLocalStream(stream);
        stream.getTracks().forEach((track) => webRTCInstance.peerConnection?.addTrack(track, stream));
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        createOffer(code);
      });
    } else {
      webRTCInstance.peerConnection!.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
        }
      };
    }

    webRTCInstance.peerConnection!.onicecandidate = (event) => {
      if (event.candidate) {
        webRTCInstance.stompClient?.send(
          `/app/signal/${code}`,
          {},
          JSON.stringify({ type: 'candidate', candidate: event.candidate })
        );
      }
    };
  });
};

const createOffer = async (code: string) => {
  if (!webRTCInstance.peerConnection) return;
  const offer = await webRTCInstance.peerConnection.createOffer();
  await webRTCInstance.peerConnection.setLocalDescription(offer);
  webRTCInstance.stompClient?.send(
    `/app/signal/${code}`,
    {},
    JSON.stringify({ type: 'offer', sdp: offer.sdp })
  );
};

const handleSignal = async (signal: SignalData, code: string) => {
  if (!webRTCInstance.peerConnection) return;

  if (signal.type === 'offer') {
    await webRTCInstance.peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: 'offer', sdp: signal.sdp })
    );
    const answer = await webRTCInstance.peerConnection.createAnswer();
    await webRTCInstance.peerConnection.setLocalDescription(answer);
    webRTCInstance.stompClient?.send(
      `/app/signal/${code}`,
      {},
      JSON.stringify({ type: 'answer', sdp: answer.sdp })
    );
  } else if (signal.type === 'answer') {
    await webRTCInstance.peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: 'answer', sdp: signal.sdp })
    );
  } else if (signal.type === 'candidate' && signal.candidate) {
    await webRTCInstance.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
  }
};

export const closeWebRTC = () => {
  if (webRTCInstance.peerConnection) {
    webRTCInstance.peerConnection.close();
    webRTCInstance.peerConnection = null;
  }
  if (webRTCInstance.stompClient?.connected) {
    webRTCInstance.stompClient.disconnect(() => {});
    webRTCInstance.stompClient = null;
  }
  webRTCInstance.isConnecting = false;
  webRTCInstance.activeCode = null;
};
