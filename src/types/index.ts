export interface Classroom {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  isActive: boolean;
  recordingUrl?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
}

export interface Attendee {
  id: number;
  student: User;
  classroom: Classroom;
  joinedAt: string;
}

export interface WebRTCSignal {
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}