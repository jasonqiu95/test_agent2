import React from 'react';
import './DeviceChrome.css';

export const DeviceChrome = ({ deviceMode = 'desktop', children }) => {
  if (deviceMode === 'desktop') {
    return <div className="device-chrome device-chrome-desktop">{children}</div>;
  }

  if (deviceMode === 'ipad') {
    return (
      <div className="device-chrome device-chrome-ipad">
        <div className="device-bezel ipad-bezel">
          <div className="device-screen ipad-screen">
            <div className="device-camera ipad-camera" />
            <div className="device-content">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  if (deviceMode === 'iphone') {
    return (
      <div className="device-chrome device-chrome-iphone">
        <div className="device-bezel iphone-bezel">
          <div className="device-notch">
            <div className="notch-speaker" />
            <div className="notch-camera" />
          </div>
          <div className="device-screen iphone-screen">
            <div className="device-content">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  if (deviceMode === 'kindle') {
    return (
      <div className="device-chrome device-chrome-kindle">
        <div className="device-bezel kindle-bezel">
          <div className="kindle-brand">Kindle</div>
          <div className="device-screen kindle-screen">
            <div className="device-content">{children}</div>
          </div>
          <div className="kindle-buttons">
            <div className="kindle-button" />
            <div className="kindle-button" />
            <div className="kindle-button" />
          </div>
        </div>
      </div>
    );
  }

  if (deviceMode === 'printspread') {
    return (
      <div className="device-chrome device-chrome-printspread">
        <div className="book-spread">
          <div className="book-page book-left-page">
            <div className="page-content">{children}</div>
          </div>
          <div className="book-spine">
            <svg className="spine-svg" viewBox="0 0 20 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="spineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#2a2a2a', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#1a1a1a', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#2a2a2a', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <rect width="20" height="300" fill="url(#spineGradient)" />
              <line x1="10" y1="0" x2="10" y2="300" stroke="#000" strokeWidth="0.5" />
            </svg>
          </div>
          <div className="book-page book-right-page">
            <div className="page-content">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="device-chrome device-chrome-desktop">{children}</div>;
};
