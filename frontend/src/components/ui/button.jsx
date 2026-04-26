import React from 'react';
import './button.css';

export const Button = ({ children, variant = 'default', size = 'default', className = '', ...props }) => {
  const baseClass = 'ui-button';
  const variantClass = `ui-button-${variant}`;
  const sizeClass = `ui-button-${size}`;
  return (
    <button className={`${baseClass} ${variantClass} ${sizeClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
};
