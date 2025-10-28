import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import './SplashWelcome.css';

const SplashWelcome = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('splash');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (screen === 'splash') {
      const timer = setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setScreen('welcome');
          setIsTransitioning(false);
        }, 600);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleCreateAccount = () => {
    navigate('/signup');
  };

  // Splash Screen
  if (screen === 'splash') {
    return (
      <div className={`splash-container ${isTransitioning ? 'fade-out' : ''}`}>
        <div className="background-circles">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>

        <div className="splash-content">
          <div className="icon-container">
            <div className="pulse-ring pulse-ring-1"></div>
            <div className="pulse-ring pulse-ring-2"></div>
            
            <div className="icon-wrapper">
              <div className="building-icon">
                <div className="building-roof"></div>
                <div className="building-body">
                  <div className="window-row">
                    <div className="window window-blue"></div>
                    <div className="window window-blue"></div>
                    <div className="window window-blue"></div>
                  </div>
                  <div className="window-row">
                    <div className="window window-purple"></div>
                    <div className="window window-purple"></div>
                    <div className="window window-purple"></div>
                  </div>
                  <div className="window-row">
                    <div className="window window-pink"></div>
                    <div className="window window-pink"></div>
                    <div className="window window-pink"></div>
                  </div>
                  <div className="building-door"></div>
                </div>
              </div>
            </div>
            
            <Sparkles className="sparkle sparkle-1" />
            <Sparkles className="sparkle sparkle-2" />
          </div>
          
          <div className="text-content">
            <h1 className="splash-title">Bhuyan Plaza</h1>
            <p className="splash-subtitle">Simplifying your rental experience</p>
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Welcome Screen
  return (
    <div className="welcome-container">
      <div className="background-circles">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <div className="welcome-card">
        <div className="corner-accent corner-top-left"></div>
        <div className="corner-accent corner-bottom-right"></div>

        <div className="illustration">
          <svg viewBox="0 0 400 300" className="svg-illustration" preserveAspectRatio="xMidYMid meet">
            {/* Railway Track */}
            <g className="railway-track">
              <line x1="0" y1="240" x2="400" y2="240" stroke="#6B7280" strokeWidth="3" />
              <line x1="0" y1="250" x2="400" y2="250" stroke="#6B7280" strokeWidth="3" />
              <rect x="20" y="238" width="8" height="14" fill="#8B5CF6" opacity="0.6" />
              <rect x="60" y="238" width="8" height="14" fill="#8B5CF6" opacity="0.6" />
              <rect x="100" y="238" width="8" height="14" fill="#8B5CF6" opacity="0.6" />
              <rect x="140" y="238" width="8" height="14" fill="#8B5CF6" opacity="0.6" />
              <rect x="180" y="238" width="8" height="14" fill="#8B5CF6" opacity="0.6" />
              <rect x="220" y="238" width="8" height="14" fill="#8B5CF6" opacity="0.6" />
              <rect x="260" y="238" width="8" height="14" fill="#8B5CF6" opacity="0.6" />
              <rect x="300" y="238" width="8" height="14" fill="#8B5CF6" opacity="0.6" />
              <rect x="340" y="238" width="8" height="14" fill="#8B5CF6" opacity="0.6" />
              <rect x="380" y="238" width="8" height="14" fill="#8B5CF6" opacity="0.6" />
            </g>

            {/* Train */}
            <g className="train-animation">
              {/* Smoke puffs */}
              <circle className="smoke smoke-1" cx="0" cy="140" r="8" fill="#D1D5DB" opacity="0.6" />
              <circle className="smoke smoke-2" cx="0" cy="145" r="10" fill="#D1D5DB" opacity="0.5" />
              <circle className="smoke smoke-3" cx="0" cy="135" r="6" fill="#D1D5DB" opacity="0.4" />
              
              {/* Train Engine */}
              <g className="train-body">
                {/* Wheels */}
                <circle cx="45" cy="240" r="12" fill="#1F2937" />
                <circle cx="45" cy="240" r="8" fill="#6B7280" />
                <circle cx="45" cy="240" r="3" fill="#E5E7EB" />
                
                <circle cx="95" cy="240" r="12" fill="#1F2937" />
                <circle cx="95" cy="240" r="8" fill="#6B7280" />
                <circle cx="95" cy="240" r="3" fill="#E5E7EB" />
                
                {/* Engine body */}
                <rect x="30" y="200" width="80" height="40" rx="4" fill="#4F46E5" />
                <rect x="35" y="180" width="50" height="20" rx="3" fill="#6366F1" />
                
                {/* Chimney */}
                <rect x="80" y="160" width="12" height="20" rx="2" fill="#1F2937" />
                <rect x="77" y="157" width="18" height="5" rx="2" fill="#374151" />
                
                {/* Cabin */}
                <rect x="40" y="185" width="40" height="15" rx="2" fill="#93C5FD" opacity="0.7" />
                
                {/* Details */}
                <circle cx="100" cy="220" r="6" fill="#FCD34D" />
                <rect x="35" y="210" width="8" height="8" rx="1" fill="#F59E0B" />
              </g>
              
              {/* Cargo Cars */}
              <g className="cargo-car-1">
                <circle cx="140" cy="240" r="10" fill="#1F2937" />
                <circle cx="140" cy="240" r="6" fill="#6B7280" />
                
                <circle cx="180" cy="240" r="10" fill="#1F2937" />
                <circle cx="180" cy="240" r="6" fill="#6B7280" />
                
                <rect x="125" y="205" width="70" height="35" rx="3" fill="#7C3AED" />
                <rect x="130" y="210" width="25" height="15" rx="2" fill="#C7D2FE" opacity="0.6" />
                <rect x="160" y="210" width="25" height="15" rx="2" fill="#C7D2FE" opacity="0.6" />
              </g>
              
              <g className="cargo-car-2">
                <circle cx="215" cy="240" r="10" fill="#1F2937" />
                <circle cx="215" cy="240" r="6" fill="#6B7280" />
                
                <circle cx="255" cy="240" r="10" fill="#1F2937" />
                <circle cx="255" cy="240" r="6" fill="#6B7280" />
                
                <rect x="200" y="205" width="70" height="35" rx="3" fill="#EC4899" />
                <rect x="205" y="210" width="25" height="15" rx="2" fill="#FEE2E2" opacity="0.6" />
                <rect x="235" y="210" width="25" height="15" rx="2" fill="#FEE2E2" opacity="0.6" />
              </g>
            </g>
          </svg>
        </div>

        <div className="welcome-text">
          <h1 className="welcome-title">
            Welcome to<br />Bhuyan Plaza
          </h1>
          <p className="welcome-subtitle">
            Manage your property and<br />tenants effortlessly.
          </p>
        </div>

        <div className="button-group">
          <button onClick={handleSignIn} className="btn btn-primary">
            <span>Sign In</span>
            <div className="btn-overlay"></div>
          </button>

         
        </div>

        <div className="floating-particles">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashWelcome;