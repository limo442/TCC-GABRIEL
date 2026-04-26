import React from 'react';
import './label.css';

export const Label = ({ className = '', ...props }) => {
  return <label className={`ui-label ${className}`.trim()} {...props} />;
};
