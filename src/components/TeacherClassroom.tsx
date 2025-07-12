import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, Users, Clock, Square, Circle } from 'lucide-react';
import { setupWebRTC, closeWebRTC } from './WebRTC';

interface Params {
  code: string;
}

const TeacherClassroom: React.FC = () => {
  const { code } = useParams<Params>();
  const navigate = useNavigate();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [sessionTime, setSessionTime] = useState<number>(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!code) {
      navigate('/');
      return;
    }

    startLocalStream();
    fetchAttendees();
    setupWebRTC(code, localVideoRef, setLocalStream, true);

    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    const attendeeInterval = setInterval(fetchAttendees, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(attendeeInterval);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      closeWebRTC();
    };
  }, [code, navigate]);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Failed to get media stream:', err);
    }
  };

  const fetchAttendees = async () => {
    try {
      const response = await fetch(`https://api.markmarketing.xyz/api/classroom/${code}/attendees`, {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: string[] = await response.json();
      setAttendees(data);
    } catch (err) {
      console.error('Failed to fetch attendees:', err);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const startRecording = () => {
    if (!localStream) return;
    const recorder = new MediaRecorder(localStream);
    recorder.ondataavailable = (e: BlobEvent) => recordedChunks.current.push(e.data);
    recorder.onstop = uploadRecording;
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const uploadRecording = async () => {
    const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
    const formData = new FormData();
    formData.append('file', blob, `classroom-${code}-${Date.now()}.webm`);

    try {
      const uploadResponse = await fetch('https://api.markmarketing.xyz/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!uploadResponse.ok) throw new Error('Failed to upload recording');
      const { url } = await uploadResponse.json();

      const saveResponse = await fetch(`https://api.markmarketing.xyz/api/classroom/${code}/recording`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        credentials: 'include'
      });
      if (!saveResponse.ok) throw new Error('Failed to save recording URL');
      alert('Recording saved successfully!');
    } catch (err) {
      console.error('Failed to upload recording:', err);
      alert('Failed to save recording');
    }
    recordedChunks.current = [];
  };

  const endSession = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    closeWebRTC();
    navigate('/');
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teaching Session</h1>
          <p className="text-gray-600">Classroom Code: <span className="font-mono font-semibold">{code}</span></p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{formatTime(sessionTime)}</span>
          </div>
          <button
            onClick={endSession}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            End Session
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="relative">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full h-96 bg-gray-900 rounded-xl object-cover"
              />
              {!isVideoOn && (
                <div className="absolute inset-0 bg-gray-900 rounded-xl flex items-center justify-center">
                  <VideoOff className="w-12 h-12 text-gray-400" />
                </div>
              )}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg">
                  <Circle className="w-3 h-3 fill-current animate-pulse" />
                  <span className="text-sm font-medium">Recording</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center mt-6">
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isVideoOn 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isAudioOn 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-full hover:bg-emerald-700 transition-colors duration-200"
                >
                  <Circle className="w-4 h-4" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-colors duration-200"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop Recording</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              Attendees ({attendees.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {attendees.map((name: string, index: number) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg border border-white/30"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {name.charAt(0)}
                  </span>
                </div>
                <span className="text-gray-700 font-medium">{name}</span>
              </div>
            ))}
          </div>
          {attendees.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No students have joined yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherClassroom;