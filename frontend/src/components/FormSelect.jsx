import React from 'react';

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = '-- Select --',
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
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </div>
  );
}
