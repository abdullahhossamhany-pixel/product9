import React from 'react';

export const Select = ({ children, value, onValueChange, ...props }) => (
  <div {...props}>{children}</div>
);
export const SelectTrigger = ({ children, className, ...props }) => (
  <button className={className} {...props}>{children}</button>
);
export const SelectValue = ({ placeholder, ...props }) => (
  <span {...props}>{placeholder}</span>
);
export const SelectContent = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);
export const SelectItem = ({ children, value, ...props }) => (
  <div data-value={value} {...props}>{children}</div>
);
export const SelectGroup = ({ children }) => <div>{children}</div>;
export const SelectLabel = ({ children }) => <div>{children}</div>;
export const SelectSeparator = () => <hr />;

export default Select;
