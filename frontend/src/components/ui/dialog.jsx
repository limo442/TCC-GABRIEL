import React from 'react';
import './dialog.css';

export const Dialog = ({ children, open, onOpenChange, ...props }) => {
  if (!open) return null;
  return (
    <div className="ui-dialog-overlay" onClick={() => onOpenChange?.(false)}>
      <div className="ui-dialog-content" onClick={e => e.stopPropagation()} {...props}>
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ children, className = '', ...props }) => {
  return <div className={`ui-dialog-content-inner ${className}`.trim()} {...props}>{children}</div>;
};

export const DialogHeader = ({ children, className = '', ...props }) => {
  return <div className={`ui-dialog-header ${className}`.trim()} {...props}>{children}</div>;
};

export const DialogTitle = ({ children, className = '', ...props }) => {
  return <h3 className={`ui-dialog-title ${className}`.trim()} {...props}>{children}</h3>;
};

export const DialogFooter = ({ children, className = '', ...props }) => {
  return <div className={`ui-dialog-footer ${className}`.trim()} {...props}>{children}</div>;
};
