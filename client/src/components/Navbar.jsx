import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
          <span className="brand-icon">🎓</span>
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
