import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setDeviceMode, selectDeviceMode } from '../../store/previewSlice';
import './DeviceSwitcher.css';

export const DeviceSwitcher = () => {
  const dispatch = useDispatch();
  const currentMode = useSelector(selectDeviceMode);

  const devices = [
    {
      id: 'iPad',
      label: 'iPad',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      ),
    },
    {
      id: 'Kindle',
      label: 'Kindle',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M8 6h8M8 10h8M8 14h5" />
        </svg>
      ),
    },
    {
      id: 'iPhone',
      label: 'iPhone',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      ),
    },
    {
      id: 'PrintSpread',
      label: 'Print Spread',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="9" height="16" rx="1" ry="1" />
          <rect x="13" y="4" width="9" height="16" rx="1" ry="1" />
        </svg>
      ),
    },
  ];

  const handleDeviceChange = (deviceId) => {
    dispatch(setDeviceMode(deviceId));
  };

  return (
    <div className="device-switcher" role="group" aria-label="Device mode selector">
      {devices.map((device) => (
        <button
          key={device.id}
          className={`device-switcher__button ${
            currentMode === device.id ? 'device-switcher__button--active' : ''
          }`}
          onClick={() => handleDeviceChange(device.id)}
          title={device.label}
          aria-label={`Switch to ${device.label} mode`}
          aria-pressed={currentMode === device.id}
        >
          <span className="device-switcher__icon">{device.icon}</span>
          <span className="device-switcher__label">{device.label}</span>
        </button>
      ))}
    </div>
  );
};
