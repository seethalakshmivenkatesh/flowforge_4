import { forwardRef } from 'react';

const Select = forwardRef(function Select({ label, error, className = '', children, ...props }, ref) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <select ref={ref} className={`input bg-white ${error ? 'border-red-400' : ''} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

export default Select;

