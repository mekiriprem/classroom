import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, VideoIcon, Clock, Play, Eye, Loader2 } from 'lucide-react';
import { Classroom } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [classroomName, setClassroomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await fetch('https://api.markmarketing.xyz/api/classroom', {
        credentials: 'include',
      });
      const data = await res.json();
      setClassrooms(data);
    } catch (err) {
      console.error('Failed to fetch classrooms:', err);
    }
  };

  const createClassroom = async () => {
    if (!classroomName.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('https://api.markmarketing.xyz/api/classroom/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: classroomName }),
        credentials: 'include',
      });
      const newClassroom = await res.json();
      setClassrooms([newClassroom, ...classrooms]);
      setClassroomName('');
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create classroom:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startClassroom = async (classroom: Classroom) => {
    try {
      await fetch(`https://api.markmarketing.xyz/api/classroom/${classroom.code}/start`, {
        method: 'POST',
        credentials: 'include',
      });
      navigate(`/classroom/${classroom.code}/teach`);
    } catch (err) {
      console.error('Failed to start class:', err);
    }
  };

  const viewRecording = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Your Classrooms</h1>
          <p className="text-gray-500 mt-1">Manage and launch your virtual classrooms</p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 shadow-md hover:shadow-xl transition"
        >
          <Plus size={18} />
          Create
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <StatCard icon={<VideoIcon />} label="Total Classrooms" value={classrooms.length} />
        <StatCard icon={<Users />} label="Active Sessions" value={classrooms.filter(c => c.isActive).length} color="emerald" />
        <StatCard icon={<Clock />} label="Recordings" value={classrooms.filter(c => c.recordingUrl).length} color="purple" />
      </div>

      {/* Classroom Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {classrooms.map(c => (
          <div key={c.id} className="p-5 bg-white rounded-xl shadow hover:shadow-lg transition border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">{c.name}</h2>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {c.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-1">
              <strong>Code:</strong> {c.code}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              <strong>Created:</strong> {new Date(c.createdAt).toLocaleDateString()}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => startClassroom(c)}
                className="flex-1 bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 flex items-center justify-center gap-1"
              >
                <Play size={16} />
                Start
              </button>
              {c.recordingUrl && (
                <button
                  onClick={() => viewRecording(c.recordingUrl)}
                  className="bg-purple-100 text-purple-700 rounded-md px-4 py-2 hover:bg-purple-200"
                >
                  <Eye size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Create a new Classroom</h2>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-4 py-2 mb-4"
              placeholder="Enter classroom name"
              value={classroomName}
              onChange={e => setClassroomName(e.target.value)}
            />
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-600 px-4 py-2 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={createClassroom}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  color = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: 'blue' | 'emerald' | 'purple';
}) => {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    purple: 'text-purple-600 bg-purple-100',
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${colorMap[color]}`}>
        {icon}
      </div>
    </div>
  );
};

export default Dashboard;
