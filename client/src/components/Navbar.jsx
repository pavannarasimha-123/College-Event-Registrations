import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LogoMark = () => (
  <svg viewBox="0 0 256 256" width="18" height="18" fill="currentColor">
    <path d="M 0 128 C 70.692 128 128 185.308 128 256 L 64 256 C 64 220.654 35.346 192 0 192 Z M 256 192 C 220.654 192 192 220.654 192 256 L 128 256 C 128 185.308 185.308 128 256 128 Z M 128 0 C 128 70.692 70.692 128 0 128 L 0 64 C 35.346 64 64 35.346 64 0 Z M 192 0 C 192 35.346 220.654 64 256 64 L 256 128 C 185.308 128 128 70.692 128 0 Z" />
  </svg>
);

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isStudent, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <span className="brand-icon">
            <LogoMark />
          </span>
          <span className="brand-text">College Events</span>
        </Link>

        {/* Mobile toggle button */}
        <button 
          className="navbar-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <span className="hamburger-icon">{mobileMenuOpen ? '✕' : '☰'}</span>
        </button>

        {/* Navigation Links */}
        <nav className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
          {/* Guest Links */}
          {!isAuthenticated && (
            <>
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={closeMobileMenu}>
                Home
              </NavLink>
              <NavLink to="/events" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={closeMobileMenu}>
                Events
              </NavLink>
              <NavLink to="/login" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={closeMobileMenu}>
                Login
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMobileMenu}>
                Register
              </Link>
            </>
          )}

          {/* Student Links */}
          {isAuthenticated && isStudent && (
            <>
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={closeMobileMenu}>
                Home
              </NavLink>
              <NavLink to="/events" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={closeMobileMenu}>
                Events
              </NavLink>
              <NavLink to="/student/my-registrations" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={closeMobileMenu}>
                My Registrations
              </NavLink>
              <NavLink to="/student/dashboard" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={closeMobileMenu}>
                Dashboard
              </NavLink>
              <div className="user-pill student-badge">
                <span>👤 {user?.name}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Logout
              </button>
            </>
          )}

          {/* Admin Links */}
          {isAuthenticated && isAdmin && (
            <>
              <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={closeMobileMenu}>
                Dashboard
              </NavLink>
              <NavLink to="/admin/events" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={closeMobileMenu}>
                Manage Events
              </NavLink>
              <div className="user-pill admin-badge">
                <span>🛡️ {user?.name || 'Admin'}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
