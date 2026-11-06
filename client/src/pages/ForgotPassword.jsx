import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');
  const [emailSent, setEmailSent] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDevResetUrl('');
    setEmailPreviewUrl('');
    setEmailSent(true);

    if (!email.trim()) {
      return setError('Please enter your registered email address.');
    }

    try {
      setLoading(true);
      const res = await authService.forgotPassword(email.trim());
      setMessage(res.message || 'A password reset link has been processed for your account.');
      if (res.emailSent !== undefined) {
        setEmailSent(res.emailSent);
      }
      if (res.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
      if (res.emailPreviewUrl) {
        setEmailPreviewUrl(res.emailPreviewUrl);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      if (err.response?.data?.devResetUrl) {
        setDevResetUrl(err.response.data.devResetUrl);
      }
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Cannot connect to server. Please ensure the backend is running or deployment has completed.');
      } else {
        setError('Unable to process your request. Please verify the email and try again.');
      }
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

        {emailPreviewUrl && (
          <div className="form-alert info" style={{ wordBreak: 'break-all' }}>
            <strong>📧 View Sent Email:</strong>{' '}
            <a href={emailPreviewUrl} target="_blank" rel="noopener noreferrer" className="auth-link">
              Click here to view the password reset email
            </a>
            <p style={{ margin: '6px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
              (Opens Ethereal Mail preview — this proves the email was sent successfully)
            </p>
          </div>
        )}

        {devResetUrl && (
          <div className="form-alert info" style={{ wordBreak: 'break-all', marginTop: '1rem', borderLeft: '4px solid #2563eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🔗</span>
              <strong style={{ fontSize: '0.95rem', color: '#1e40af' }}>Direct Password Reset Link:</strong>
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#475569' }}>
              Click the button below to set your new password immediately:
            </p>
            <Link 
              to={devResetUrl.startsWith('http') ? new URL(devResetUrl, window.location.origin).pathname : devResetUrl} 
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-block', textDecoration: 'none', padding: '10px 22px', fontWeight: 600 }}
            >
              Reset My Password Now &rarr;
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
              {emailSent
                ? 'Please check your inbox (and spam folder) for the password reset email. The link will remain active for 1 hour.'
                : 'Render free tier blocks outbound SMTP, so no external email was delivered. Please click the blue "Reset My Password Now" button above to change your password directly.'}
            </p>
            <button
              onClick={() => {
                setMessage('');
                setError('');
                setEmail('');
                setDevResetUrl('');
                setEmailSent(true);
              }}
              className="btn btn-secondary btn-sm"
            >
              Request Another Link
            </button>
          </div>
        )}

        <div className="auth-footer">
          <p>
            Remember your credentials?{' '}
            <Link to="/login" className="auth-link">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
