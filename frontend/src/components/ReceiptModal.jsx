import React, { useRef, useEffect } from 'react';
import { FaTimes, FaPrint } from 'react-icons/fa';
import TransactionReceipt from './TransactionReceipt';

export default function ReceiptModal({ isOpen, onClose, transaction }) {
  const receiptRef = useRef(null);

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

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write(receiptRef.current.innerHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-xs w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b p-2 flex justify-between items-center flex-shrink-0">
          <h2 className="text-sm font-bold text-gray-900">Transaction Receipt</h2>
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

        <div ref={receiptRef} className="overflow-auto flex-1">
          <TransactionReceipt transaction={transaction} />
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
  );
}
