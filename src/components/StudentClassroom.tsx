import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, Users, Clock } from 'lucide-react';
import { setupWebRTC, closeWebRTC } from './WebRTC';

interface Params {
  code: string;
}

const StudentClassroom: React.FC = () => {
  const { code } = useParams<Params>();
  const navigate = useNavigate();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!code) {
      navigate('/');
      return;
    }

    joinClassroom();
    startLocalStream();
    fetchAttendees();
    setupWebRTC(code, localVideoRef, setLocalStream, false);

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

  const joinClassroom = async () => {
  try {
    const userId = 3; // Replace with dynamic value from auth context
    const response = await fetch(`http://localhost:8080/api/attend/${code}?userId=${userId}`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to join classroom');
  } catch (err) {
    console.error('Failed to join classroom:', err);
    navigate('/');
  }
};


  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Failed to get local stream:', err);
    }
  };

  const fetchAttendees = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/classroom/${code}/attendees`, {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch attendees');
      const data: string[] = await response.json();
      setAttendees(data);
    } catch (err) {
      console.error('Failed to fetch attendees:', err);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioOn(audioTrack.enabled);
    }
  };

  const leaveClassroom = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    closeWebRTC();
    navigate('/dashboard');
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
          <h1 className="text-2xl font-bold text-gray-900">Classroom Session</h1>
          <p className="text-gray-600">Code: <span className="font-mono font-semibold">{code}</span></p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{formatTime(sessionTime)}</span>
          </div>
          <button
            onClick={leaveClassroom}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Leave
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
            </div>
            <div className="flex items-center justify-center space-x-6 mt-6">
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isVideoOn ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isAudioOn ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Attendees ({attendees.length})</h3>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {attendees.map((name, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg border border-white/30"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{name.charAt(0)}</span>
                </div>
                <span className="text-gray-700 font-medium">{name}</span>
              </div>
            ))}
          </div>
          {attendees.length === 0 && (
            <p className="text-gray-500 text-center py-8">No attendees yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentClassroom;