import React, { useRef, useState, useEffect, useCallback } from 'react';
import './ResizablePanel.css';

export interface ResizablePanelProps {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  position?: 'left' | 'right';
  isVisible?: boolean;
  className?: string;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  minWidth = 200,
  maxWidth = 600,
  defaultWidth = 300,
  position = 'left',
  isVisible = true,
  className = '',
}) => {
  const [width, setWidth] = useState<number>(defaultWidth);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const delta = position === 'left'
      ? e.clientX - startXRef.current
      : startXRef.current - e.clientX;

    const newWidth = Math.max(
      minWidth,
      Math.min(maxWidth, startWidthRef.current + delta)
    );

    setWidth(newWidth);
  }, [isResizing, minWidth, maxWidth, position]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className={`resizable-panel resizable-panel-${position} ${className}`}
      style={{ width: `${width}px` }}
    >
      <div className="resizable-panel-content">
        {children}
      </div>
      <div
        className={`resizable-panel-handle resizable-panel-handle-${position}`}
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${position} panel`}
      >
        <div className="resizable-panel-handle-line" />
      </div>
    </div>
  );
};
