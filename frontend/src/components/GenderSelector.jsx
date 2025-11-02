import React from 'react';
import { FaMars, FaVenus } from 'react-icons/fa';

export default function GenderSelector({ value, onChange, disabled = false }) {
  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => !disabled && onChange('male')}
        disabled={disabled}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded transition-colors ${
          value === 'male' ? 'bg-blue-100 border-blue-500' : 'bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'}`}
      >
        <FaMars className="text-blue-500" size={20} />
        <span>Male</span>
      </button>
      <button
        type="button"
        onClick={() => !disabled && onChange('female')}
        disabled={disabled}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded transition-colors ${
          value === 'female' ? 'bg-pink-100 border-pink-500' : 'bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-50'}`}
      >
        <FaVenus className="text-pink-500" size={20} />
        <span>Female</span>
      </button>
    </div>
  );
}
