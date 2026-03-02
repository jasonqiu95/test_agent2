import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setDeviceMode, selectDeviceMode } from '../../store/previewSlice';
import './DeviceSwitcher.css';

export type DeviceMode = 'iPad' | 'Kindle' | 'iPhone' | 'PrintSpread';

interface DeviceOption {
  id: DeviceMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const deviceOptions: DeviceOption[] = [
  {
    id: 'iPad',
    label: 'iPad',
    description: 'Tablet view (768x1024)',
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
    description: 'E-reader view (600x800)',
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
    description: 'Mobile view (375x667)',
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
    description: 'Two-page print layout',
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

/**
 * DeviceSelector component for toggling between different device preview modes
 *
 * Features:
 * - Toggle between iPad, Kindle, iPhone, and Print Spread modes
 * - Visual icons for each device type
 * - Integrates with Redux preview state
 * - Keyboard accessible with ARIA labels
 */
export const DeviceSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentMode = useAppSelector(selectDeviceMode);

  const handleDeviceChange = (deviceId: DeviceMode) => {
    dispatch(setDeviceMode(deviceId));
  };

  return (
    <div className="device-switcher" role="group" aria-label="Device mode selector">
      {deviceOptions.map((device) => (
        <button
          key={device.id}
          className={`device-switcher__button ${
            currentMode === device.id ? 'device-switcher__button--active' : ''
          }`}
          onClick={() => handleDeviceChange(device.id)}
          title={`${device.label} - ${device.description}`}
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

export default DeviceSelector;
