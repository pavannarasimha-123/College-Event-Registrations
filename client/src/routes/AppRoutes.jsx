import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Home from '../pages/Home';
import Register from '../pages/Register';
import Login from '../pages/Login';
import StudentDashboard from '../pages/StudentDashboard';
import EventList from '../pages/EventList';
import EventDetails from '../pages/EventDetails';
import MyRegistrations from '../pages/MyRegistrations';
import AdminDashboard from '../pages/AdminDashboard';
import ManageEvents from '../pages/ManageEvents';

// Route Guard
import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/events" element={<EventList />} />
      <Route path="/events/:id" element={<EventDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/my-registrations"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MyRegistrations />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageEvents />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
