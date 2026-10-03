import React from 'react';

export const DocumentViewerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  documentUrl?: string;
  documentName?: string;
  patientName?: string;
  hospitalName?: string;
  bloodGroup?: string;
  title?: string;
}> = ({ isOpen, onClose, documentUrl, title, documentName, patientName, hospitalName, bloodGroup }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">{title || documentName || 'Document'}</h2>
        <div className="mb-4">
          <p>Patient: {patientName}</p>
          <p>Hospital: {hospitalName}</p>
          <p>Blood Group: {bloodGroup}</p>
          <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">View Document</a>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Close</button>
      </div>
    </div>
  );
};
