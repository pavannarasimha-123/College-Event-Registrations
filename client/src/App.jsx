import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-root-wrapper">
          {/* Global Background Video (Fixed, behind everything) */}
          <div className="fixed-video-bg">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="bg-video"
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
            />
            {/* Dark cinematic vignette overlay */}
            <div className="bg-video-overlay" />
          </div>

          {/* Fixed vertical guide lines at 36rem container edges */}
          <div className="guide-line guide-line-left" />
          <div className="guide-line guide-line-right" />

          {/* Global SVG noise filter for shiny gradient text */}
          <svg className="svg-noise-defs" aria-hidden="true">
            <filter id="c3-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
              <feComposite in2="SourceGraphic" operator="in" result="noise" />
              <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
            </filter>
          </svg>

          {/* Main App Content on top */}
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <AppRoutes />
            </main>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
