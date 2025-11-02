import React from 'react';
import { FaMars, FaVenus } from 'react-icons/fa';

export default function GenderIcon({ gender, size = 16 }) {
  return gender === 'male' ? (
    <FaMars className="text-blue-500" size={size} />
  ) : (
    <FaVenus className="text-pink-500" size={size} />
  );
}
