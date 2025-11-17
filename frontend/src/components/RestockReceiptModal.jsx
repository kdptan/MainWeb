import React, { useRef, useEffect } from 'react';
import { FaTimes, FaPrint } from 'react-icons/fa';
import RestockReceipt from './RestockReceipt';

export default function RestockReceiptModal({ isOpen, onClose, restockData }) {
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

  // Close modal on outside click
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

  if (!isOpen || !restockData) return null;

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
      {/* Black Overlay - fixed to viewport, doesn't scroll with page */}
      <div className="fixed inset-0 bg-black bg-opacity-70 z-40 pointer-events-none" />
      
      {/* Receipt Modal - fixed to viewport center, doesn't scroll with page */}
      <div
        ref={modalRef}
        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs p-4"
        style={{ maxHeight: '90vh' }}
      >
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col h-full min-h-0">
          <div className="sticky top-0 bg-white border-b p-3 flex justify-between items-center flex-shrink-0 z-10">
            <h2 className="text-sm font-bold text-gray-900">Restock Receipt</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-secondary text-white rounded hover:bg-orange-500 transition-colors"
              >
                <FaPrint size={14} /> Print
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>

          <div ref={receiptRef} className="overflow-y-auto flex-1">
            <RestockReceipt restockData={restockData} />
          </div>

          <div className="border-t p-3 flex justify-end gap-2 flex-shrink-0 bg-white">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
