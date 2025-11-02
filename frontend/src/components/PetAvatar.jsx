import React from 'react';
import { FaPaw } from 'react-icons/fa';

export default function PetAvatar({ imageUrl, size = 'medium', className = '' }) {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
  };

  const iconSizes = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-100 overflow-hidden ${className}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl.startsWith('http') || imageUrl.startsWith('blob:') ? imageUrl : `http://127.0.0.1:8000${imageUrl}`}
          alt="Pet"
          className="w-full h-full object-cover"
        />
      ) : (
        <FaPaw className={`text-gray-400 ${iconSizes[size]}`} />
      )}
    </div>
  );
}
