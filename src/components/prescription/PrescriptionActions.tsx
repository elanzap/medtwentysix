import React from 'react';
import { Eye } from 'lucide-react';
import type { Prescription } from '../../types';
import { generatePrescriptionPDF } from '../../utils/pdfGenerator';

interface PrescriptionActionsProps {
  prescription: Partial<Prescription>;
  onSave: (prescription: Partial<Prescription>) => void;
}

export const PrescriptionActions: React.FC<PrescriptionActionsProps> = ({
  prescription,
  onSave,
}) => {
  const handleViewAndPrint = async () => {
    try {
      // Generate PDF and get the blob URL
      const pdfResult = await generatePrescriptionPDF(prescription, true);
      
      if (!pdfResult) {
        throw new Error('Failed to generate PDF');
      }

      // Update prescription with PDF details
      const updatedPrescription = {
        ...prescription,
        pdfBlob: pdfResult.blob,
        pdfUrl: pdfResult.url
      };

      // Open in a new window
      const newWindow = window.open(pdfResult.url, '_blank');
      if (!newWindow) {
        alert('Please allow popups to view the prescription');
        return;
      }

      // Save after successful preview
      onSave(updatedPrescription);
    } catch (error) {
      console.error('Error generating prescription PDF:', error);
      alert('Error generating prescription PDF. Please try again.');
    }
  };

  return (
    <div className="flex justify-end space-x-4">
      <button
        type="button"
        onClick={handleViewAndPrint}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Eye className="h-4 w-4 mr-2" />
        View & Print
      </button>
    </div>
  );
};
