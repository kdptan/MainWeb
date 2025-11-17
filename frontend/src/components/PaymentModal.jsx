import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatters';

export default function PaymentModal({ isOpen, onClose, order, onPaymentComplete }) {
  const [amountPaid, setAmountPaid] = useState('');

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

  // Reset state when modal opens with a new order
  useEffect(() => {
    if (isOpen) {
      setAmountPaid('');
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  // Helper function to parse price as number
  const parsePrice = (price) => {
    if (typeof price === 'string') return parseFloat(price) || 0;
    return price || 0;
  };

  // Generate unique 12-digit reference number
  const generateReferenceNumber = () => {
    // Format: YYYYMMDDXXXX (date + 4 random digits)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${year}${month}${day}${randomPart}`;
  };

  // Calculate totals
  const subtotal = order.items?.reduce((sum, item) => sum + (parsePrice(item.price) * item.quantity), 0) || 0;
  const tax = subtotal * 0.12; // 12% VAT
  const total = subtotal + tax;
  const change = amountPaid ? parseFloat(amountPaid) - total : 0;

  const handleCompletePayment = async (e) => {
    e.preventDefault();

    // Validate amount paid
    if (!amountPaid || parseFloat(amountPaid) < total) {
      alert('Amount paid must be greater than or equal to total');
      return;
    }

    // Get current date and time
    const now = new Date();
    const paymentDate = now.toISOString().split('T')[0];
    const paymentTime = now.toTimeString().slice(0, 5);

    // Create transaction data with auto-generated reference number
    const transaction = {
      referenceNumber: generateReferenceNumber(),
      paymentDate,
      paymentTime,
      items: order.items || [],
      subtotal,
      tax,
      total,
      amountPaid: parseFloat(amountPaid),
      change,
      customerName: order.user_details?.username || 'Customer',
      orderId: order.order_id || order.id,
      branch: order.branch,
    };

    // Store transaction data in session/localStorage for view receipt later
    const existingTransactions = JSON.parse(localStorage.getItem('orderTransactions') || '{}');
    existingTransactions[order.id] = transaction;
    localStorage.setItem('orderTransactions', JSON.stringify(existingTransactions));

    // Call the callback to update order status with payment data
    if (onPaymentComplete) {
      await onPaymentComplete({
        amountPaid: parseFloat(amountPaid),
        change: change,
      });
    } else {
      alert('Payment completed successfully!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-secondary to-orange-500 text-white p-6 flex justify-between items-center">
          <h2 className="heading-main">Payment Entry</h2>
          <button onClick={onClose} className="text-white hover:opacity-80">
            <FaTimes size={24} />
          </button>
        </div>

        <form onSubmit={handleCompletePayment} className="p-6 space-y-6">
          {/* Order Items Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Items Purchased</h3>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-white rounded border border-gray-100">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.product_details?.name || item.service_details?.name || 'Item'}
                    </p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(parsePrice(item.price) * item.quantity)}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(parsePrice(item.price))} each</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t-2 border-gray-300 pt-4">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax (12% VAT):</span>
                <span className="font-semibold text-secondary">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 bg-yellow-50 p-2 rounded">
                <span>Total:</span>
                <span className="text-secondary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount Paid by Customer</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Enter amount paid"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent text-lg font-semibold"
                />
              </div>
            </div>
            {amountPaid && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex justify-between text-blue-900">
                  <span className="font-semibold">Change:</span>
                  <span className="text-xl font-bold">{formatCurrency(Math.max(change, 0))}</span>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2"
            >
              <FaCheck /> Complete Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
