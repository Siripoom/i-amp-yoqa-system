import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const DialogContext = createContext();

const Dialog = ({ children, open, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(open || false);

  const handleOpenChange = (newOpen) => {
    setIsOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  return (
    <DialogContext.Provider value={{
      isOpen: open !== undefined ? open : isOpen,
      onOpenChange: handleOpenChange
    }}>
      {children}
    </DialogContext.Provider>
  );
};
Dialog.propTypes = {
  children: PropTypes.node,
  open: PropTypes.bool,
  onOpenChange: PropTypes.func
};

const DialogTrigger = ({ children, asChild = false, ...props }) => {
  const { onOpenChange } = useContext(DialogContext);

  if (asChild) {
    return React.cloneElement(children, {
      onClick: () => onOpenChange(true),
      ...props
    });
  }

  return (
    <button onClick={() => onOpenChange(true)} {...props}>
      {children}
    </button>
  );
};
DialogTrigger.propTypes = {
  children: PropTypes.node,
  asChild: PropTypes.bool
};

const DialogContent = ({ className = "", children, ...props }) => {
  const { isOpen, onOpenChange } = useContext(DialogContext);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div
        className={`relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg ${className}`}
        {...props}
      >
        {children}
        
        {/* Close button */}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={() => onOpenChange(false)}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
          >
            <path
              d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
DialogContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

const DialogHeader = ({ className = "", children, ...props }) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  >
    {children}
  </div>
);
DialogHeader.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

const DialogTitle = ({ className = "", children, ...props }) => (
  <h2
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h2>
);
DialogTitle.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

const DialogDescription = ({ className = "", children, ...props }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props}>
    {children}
  </p>
);
DialogDescription.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

const DialogFooter = ({ className = "", children, ...props }) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
    {...props}
  >
    {children}
  </div>
);
DialogFooter.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
