/**
 * ElementIcon Component
 * Displays an icon for element types and chapters
 */

import React from 'react';
import { getIcon, IconType } from './icons';

export interface ElementIconProps {
  type: IconType;
  className?: string;
  'aria-hidden'?: boolean;
}

/**
 * Renders an icon for the given element type or chapter
 */
export const ElementIcon: React.FC<ElementIconProps> = ({
  type,
  className = '',
  'aria-hidden': ariaHidden = true,
}) => {
  const icon = getIcon(type);

  return (
    <span
      className={`element-icon ${className}`}
      aria-hidden={ariaHidden}
      role="img"
      aria-label={`${type} icon`}
    >
      {icon}
    </span>
  );
};
