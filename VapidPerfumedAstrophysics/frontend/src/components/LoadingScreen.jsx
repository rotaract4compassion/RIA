import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function LoadingScreen({ message }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-white gap-4">
      <LoadingSpinner size={52} />
      {message && <p className="text-sm text-gray-400">{message}</p>}
    </div>
  );
}
