import React from 'react';
import './input.css';

export const Input = ({ className = '', ...props }) => {
  return <input className={`ui-input ${className}`.trim()} {...props} />;
};
