import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinClassroom: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to join classroom');
      navigate(`/classroom/${code}`);
    } catch (error) {
      console.error('Error joining classroom:', error);
      alert('Failed to join classroom. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Join Classroom</h1>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Classroom Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter classroom code"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !name.trim() || !code.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {isLoading ? 'Joining...' : 'Join Classroom'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinClassroom;