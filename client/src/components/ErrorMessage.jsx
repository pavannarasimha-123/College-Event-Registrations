import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="error-alert">
      <div className="error-content">
        <span className="error-icon">⚠️</span>
        <span className="error-text">{message}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-sm btn-outline-danger">
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
