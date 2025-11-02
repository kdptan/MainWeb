import React from 'react';
import { FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

export default function Toast({ message, type = 'success', isVisible = false }) {
  if (!isVisible) return null;

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  const icons = {
    success: <FaCheck size={20} />,
    error: <FaTimes size={20} />,
    warning: <FaExclamationTriangle size={20} />,
    info: <FaInfoCircle size={20} />,
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div
        className={`${typeStyles[type]} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}
      >
        <div className="flex-shrink-0">{icons[type]}</div>
        <p className="flex-1 font-medium">{message}</p>
      </div>
    </div>
  );
}
