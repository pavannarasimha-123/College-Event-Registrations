import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Verifying authentication..." />;
  }

  // Not logged in -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization if restricted
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If admin tries to access student-only route, redirect to admin dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // If student tries to access admin route, redirect to student dashboard
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
