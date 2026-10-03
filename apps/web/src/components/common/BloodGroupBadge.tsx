import React from 'react';
import { BloodGroup } from '../../types';

export const BloodGroupBadge: React.FC<{ 
  bloodGroup?: BloodGroup | string;
  group?: BloodGroup | string;
  size?: string;
}> = ({ bloodGroup, group, size }) => {
  const bg = bloodGroup || group || '';
  return <span className={`px-2 py-1 bg-red-100 text-red-800 rounded font-bold ${size ? `text-${size}` : ''}`}>{bg}</span>;
};
