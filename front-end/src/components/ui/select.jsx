import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const SelectContext = createContext();

const Select = ({ children, value, onValueChange, defaultValue }) => {
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || '');
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (newValue) => {
    setSelectedValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
    setIsOpen(false);
  };

  return (
    <SelectContext.Provider value={{
      value: value || selectedValue,
      onValueChange: handleValueChange,
      isOpen,
      setIsOpen
    }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};
Select.propTypes = {
  children: PropTypes.node,
  value: PropTypes.string,
  onValueChange: PropTypes.func,
  defaultValue: PropTypes.string
};

const SelectTrigger = React.forwardRef(({ className = "", children, ...props }, ref) => {
  const { isOpen, setIsOpen } = useContext(SelectContext);
  
  return (
    <button
      ref={ref}
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {children}
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      >
        <path
          d="m4.5 6 3.5 3.5L11.5 6"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";
SelectTrigger.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

const SelectValue = ({ placeholder, className = "" }) => {
  const { value } = useContext(SelectContext);
  
  return (
    <span className={className}>
      {value || placeholder}
    </span>
  );
};
SelectValue.propTypes = {
  placeholder: PropTypes.string,
  className: PropTypes.string
};

const SelectContent = ({ className = "", children, ...props }) => {
  const { isOpen } = useContext(SelectContext);
  
  if (!isOpen) return null;
  
  return (
    <div
      className={`absolute top-full left-0 z-50 min-w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 ${className}`}
      {...props}
    >
      <div className="p-1">
        {children}
      </div>
    </div>
  );
};
SelectContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

const SelectItem = ({ className = "", children, value, ...props }) => {
  const { onValueChange } = useContext(SelectContext);
  
  return (
    <div
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </div>
  );
};
SelectItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  value: PropTypes.string
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
