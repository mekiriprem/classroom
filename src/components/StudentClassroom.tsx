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
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    if (!code) {
      navigate('/');
      return;
    }

    joinClassroom();
    fetchAttendees();
    setupWebRTC(code, remoteVideoRef, null, false); // Student: setLocalStream = null, isTeacher = false

    const timer = setInterval(() => setSessionTime((prev) => prev + 1), 1000);
    const interval = setInterval(fetchAttendees, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(interval);
      closeWebRTC();
    };
  }, [code, navigate]);

  const joinClassroom = async () => {
    try {
      const userId = 3; // Replace with dynamic value later
      await fetch(`https://api.markmarketing.xyz/api/attend/${code}?userId=${userId}`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Join failed:', err);
      navigate('/');
    }
  };

  const fetchAttendees = async () => {
    try {
      const res = await fetch(`https://api.markmarketing.xyz/api/classroom/${code}/attendees`, {
        credentials: 'include',
      });
      const data = await res.json();
      setAttendees(data);
    } catch (err) {
      console.error('Failed to fetch attendees:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
            onClick={() => {
              closeWebRTC();
              navigate('/dashboard');
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <video
              ref={remoteVideoRef}
              autoPlay
              className="w-full h-96 bg-black rounded-xl object-cover"
            />
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <h3 className="text-gray-800 font-semibold mb-2">Attendees ({attendees.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {attendees.map((name, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-white/50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{name.charAt(0)}</span>
                </div>
                <span className="text-gray-700">{name}</span>
              </div>
            ))}
          </div>
          {attendees.length === 0 && <p className="text-gray-500 text-center py-4">No students joined</p>}
        </div>
      </div>
    </div>
  );
};

export default StudentClassroom;
