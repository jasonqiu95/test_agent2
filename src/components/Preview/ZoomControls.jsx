import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setZoom, selectZoomLevel } from '../../store/previewSlice';
import './ZoomControls.css';

const PRESET_ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];

export const ZoomControls = () => {
  const dispatch = useDispatch();
  const zoomLevel = useSelector(selectZoomLevel);

  const handleZoomIn = () => {
    const currentIndex = PRESET_ZOOM_LEVELS.findIndex(level => level >= zoomLevel);
    if (currentIndex < PRESET_ZOOM_LEVELS.length - 1) {
      dispatch(setZoom(PRESET_ZOOM_LEVELS[currentIndex + 1]));
    } else if (zoomLevel < 200) {
      dispatch(setZoom(200));
    }
  };

  const handleZoomOut = () => {
    const currentIndex = PRESET_ZOOM_LEVELS.findIndex(level => level >= zoomLevel);
    if (currentIndex > 0) {
      dispatch(setZoom(PRESET_ZOOM_LEVELS[currentIndex - 1]));
    } else if (zoomLevel > 50) {
      dispatch(setZoom(50));
    }
  };

  const handleZoomReset = () => {
    dispatch(setZoom(100));
  };

  const handlePresetSelect = (e) => {
    const level = parseInt(e.target.value, 10);
    if (!isNaN(level)) {
      dispatch(setZoom(level));
    }
  };

  return (
    <div className="zoom-controls">
      <button
        className="zoom-controls__btn"
        onClick={handleZoomOut}
        disabled={zoomLevel <= 50}
        title="Zoom out"
        aria-label="Zoom out"
      >
        −
      </button>

      <select
        className="zoom-controls__select"
        value={zoomLevel}
        onChange={handlePresetSelect}
        aria-label="Zoom level"
      >
        {PRESET_ZOOM_LEVELS.map(level => (
          <option key={level} value={level}>
            {level}%
          </option>
        ))}
        {!PRESET_ZOOM_LEVELS.includes(zoomLevel) && (
          <option value={zoomLevel}>{zoomLevel}%</option>
        )}
      </select>

      <button
        className="zoom-controls__btn"
        onClick={handleZoomIn}
        disabled={zoomLevel >= 200}
        title="Zoom in"
        aria-label="Zoom in"
      >
        +
      </button>

      <button
        className="zoom-controls__btn zoom-controls__btn--reset"
        onClick={handleZoomReset}
        title="Reset zoom to 100%"
        aria-label="Reset zoom"
      >
        ⟲
      </button>
    </div>
  );
};
