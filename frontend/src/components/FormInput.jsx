import React from 'react';

export default function FormInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  error = null,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props}
      />
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </div>
  );
}
