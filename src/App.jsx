import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import AdminDashboard from './pages/AdminDashboard';

import AdminCompanies from './pages/AdminCompanies';
import AdminJobs from './pages/AdminJobs';
import AdminUsers from './pages/AdminUsers';
import AdminApplications from './pages/AdminApplications';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin-companies" element={<AdminCompanies />} />
      <Route path="/admin-jobs" element={<AdminJobs />} />
      <Route path="/admin-users" element={<AdminUsers />} />
      <Route path="/admin-applications" element={<AdminApplications />} />
    </Routes>
  );
};

export default App;
