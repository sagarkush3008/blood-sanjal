import React from 'react';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  return <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded">{status}</span>;
};
