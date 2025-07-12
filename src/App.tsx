import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JoinClassroom from './components/JoinClassroom';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import StudentClassroom from './components/StudentClassroom';
import TeacherClassroom from './components/TeacherClassroom';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JoinClassroom />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/classroom/:code" element={<StudentClassroom />} />
          <Route path="/classroom/:code/teach" element={<TeacherClassroom />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;