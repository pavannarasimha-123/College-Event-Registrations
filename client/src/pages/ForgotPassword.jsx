import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDevResetUrl('');

    if (!email.trim()) {
      return setError('Please enter your registered email address.');
    }

    try {
      setLoading(true);
      const res = await authService.forgotPassword(email.trim());
      setMessage(res.message || 'A password reset link has been dispatched to your email.');
      if (res.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(
        err.response?.data?.message || 'Unable to process your request. Please verify the email and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🔑</div>
          <h2>Reset Password</h2>
          <p>Enter your registered college email to receive a secure reset link</p>
        </div>

        {error && <div className="form-alert error">{error}</div>}
        {message && <div className="form-alert success">{message}</div>}

        {devResetUrl && (
          <div className="form-alert info" style={{ wordBreak: 'break-all' }}>
            <strong>Local Dev Direct Link:</strong>{' '}
            <Link to={new URL(devResetUrl, window.location.origin).pathname} className="auth-link">
              Click here to reset your password now
            </Link>
          </div>
        )}

        {!message ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Registered Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@college.edu"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Please check your inbox (and spam folder) for the password reset email. The link will remain active for 1 hour.
            </p>
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={() => {
                setMessage('');
                setDevResetUrl('');
              }}
            >
              Try another email
            </button>
          </div>
        )}

        <div className="auth-footer">
          <p>
            Remember your credentials? <Link to="/login" className="auth-link">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
