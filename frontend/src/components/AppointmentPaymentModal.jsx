import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatters';

export default function AppointmentPaymentModal({ isOpen, onClose, appointment, onPaymentComplete }) {
  const [selectedSize, setSelectedSize] = useState('M');
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

  // Reset state when modal opens with a new appointment
  useEffect(() => {
    if (isOpen && appointment) {
      setSelectedSize('M');
      setAmountPaid('');
    }
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  // Helper function to parse price as number
  const parsePrice = (price) => {
    if (typeof price === 'string') return parseFloat(price) || 0;
    return price || 0;
  };

  // Get price based on selected size
  const getPriceForSize = () => {
    const service = appointment.service_details;
    if (!service) return 0;

    // If service doesn't have sizes, use base price
    if (!service.has_sizes) {
      return parsePrice(service.base_price);
    }

    // Return size-based price
    switch (selectedSize) {
      case 'S':
        return parsePrice(service.small_price);
      case 'M':
        return parsePrice(service.medium_price);
      case 'L':
        return parsePrice(service.large_price);
      case 'XL':
        return parsePrice(service.extra_large_price);
      default:
        return parsePrice(service.medium_price);
    }
  };

  // Generate unique 12-digit reference number
  const generateReferenceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${year}${month}${day}${randomPart}`;
  };

  // Calculate service price
  const servicePrice = getPriceForSize();
  
  // Calculate add-ons total
  const addOnsTotal = appointment.add_ons?.reduce((sum, addon) => sum + parsePrice(addon.addon_price), 0) || 0;
  
  // Calculate totals
  const subtotal = servicePrice + addOnsTotal;
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

    // Create transaction data
    const transaction = {
      referenceNumber: generateReferenceNumber(),
      paymentDate,
      paymentTime,
      appointmentId: appointment.id,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.start_time,
      serviceSize: appointment.service_details?.has_sizes ? selectedSize : 'N/A',
      servicePrice,
      addOns: appointment.add_ons || [],
      addOnsTotal,
      subtotal,
      tax,
      total,
      amountPaid: parseFloat(amountPaid),
      change,
      customerName: appointment.user_details?.username || 'Customer',
      petName: appointment.pet_details?.name || 'Pet',
      branch: appointment.branch,
      status: 'completed'
    };

    // Store transaction data in localStorage
    const existingTransactions = JSON.parse(localStorage.getItem('appointmentTransactions') || '{}');
    existingTransactions[appointment.id] = transaction;
    localStorage.setItem('appointmentTransactions', JSON.stringify(existingTransactions));

    // Call the callback to update appointment status
    if (onPaymentComplete) {
      await onPaymentComplete(transaction);
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
          {/* Appointment Details */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Appointment Details</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="font-medium">Appointment ID:</span>
                <span>APT-{appointment.id.toString().padStart(6, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Service:</span>
                <span>{appointment.service_details?.service_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Pet:</span>
                <span>{appointment.pet_details?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Time:</span>
                <span>{appointment.start_time}</span>
              </div>
            </div>
          </div>

          {/* Size Selection (if applicable) */}
          {appointment.service_details?.has_sizes && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pet Size</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent text-lg font-semibold"
              >
                <option value="S">Small - {formatCurrency(parsePrice(appointment.service_details?.small_price))}</option>
                <option value="M">Medium - {formatCurrency(parsePrice(appointment.service_details?.medium_price))}</option>
                <option value="L">Large - {formatCurrency(parsePrice(appointment.service_details?.large_price))}</option>
                <option value="XL">Extra Large - {formatCurrency(parsePrice(appointment.service_details?.extra_large_price))}</option>
              </select>
            </div>
          )}

          {/* Service & Add-ons Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Service Breakdown</h3>
            
            {/* Main Service */}
            <div className="space-y-2 mb-3 pb-3 border-b-2 border-gray-300">
              <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{appointment.service_details?.service_name}</p>
                  {appointment.service_details?.has_sizes && (
                    <p className="text-sm text-gray-600">Size: {selectedSize}</p>
                  )}
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(servicePrice)}</p>
              </div>
            </div>

            {/* Add-ons */}
            {appointment.add_ons && appointment.add_ons.length > 0 && (
              <div className="space-y-2 mb-4 pb-4 border-b-2 border-gray-300">
                <p className="text-sm font-semibold text-gray-700 mb-2">Add-ons:</p>
                {appointment.add_ons.map((addon, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-gray-100">
                    <p className="font-medium text-gray-900">{addon.service_name}</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(parsePrice(addon.addon_price))}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2">
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
