import React from 'react';
import { DonationRecord } from '../../types';

export const SocialPostCardModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  donation: DonationRecord;
}> = ({ isOpen, onClose, donation }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">Share Donation</h2>
        <div className="mb-4">
          <p>Donation ID: {donation.id}</p>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Close</button>
      </div>
    </div>
  );
};
