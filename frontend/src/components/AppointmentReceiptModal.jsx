import React, { useRef, useEffect } from 'react';
import { FaTimes, FaPrint } from 'react-icons/fa';
import AppointmentReceipt from './AppointmentReceipt';

export default function AppointmentReceiptModal({ isOpen, onClose, appointment }) {
  const receiptRef = useRef(null);
  const modalRef = useRef(null);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (!modalRef.current) return;
      if (!modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !appointment) return null;

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write(receiptRef.current.innerHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 z-40 pointer-events-none" />

      <div ref={modalRef} className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs p-4" style={{ maxHeight: '90vh' }}>
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col h-full min-h-0">
          <div className="sticky top-0 bg-white border-b p-2 flex justify-between items-center flex-shrink-0 z-10">
            <h2 className="text-sm font-bold text-gray-900">Appointment Confirmation</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-secondary text-white rounded hover:bg-orange-500 transition-colors"
              >
                <FaPrint size={14} /> Print
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={18} />
              </button>
            </div>
          </div>

          <div ref={receiptRef} className="overflow-y-auto flex-1 overscroll-contain">
            <AppointmentReceipt appointment={appointment} />
          </div>

          <div className="border-t p-2 flex justify-end gap-1 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
