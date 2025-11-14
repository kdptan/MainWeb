import React from 'react';
import { formatOrderId } from '../utils/formatters';

export default function TransactionReceipt({ transaction }) {
  if (!transaction) return null;

  // Helper function to parse price as number
  const parsePrice = (price) => {
    if (typeof price === 'string') return parseFloat(price) || 0;
    return price || 0;
  };

  const formatDateTime = (date, time) => {
    const d = new Date(date);
    const formattedDate = d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `${formattedDate} at ${time}`;
  };

  return (
    <div className="bg-white p-4 text-gray-900 font-mono text-xs" style={{ lineHeight: '1.6' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-400 pb-3 mb-4">
        <h1 className="text-base font-bold tracking-wide">CHONKY PET STORE</h1>
        <p className="text-[10px] mt-1">{transaction.branch} Branch</p>
        <p className="text-[10px]">Professional Pet Care & Supplies</p>
      </div>

      {/* Transaction Info */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-4">
        <div className="flex justify-between mb-1.5">
          <span className="font-semibold">Reference #:</span>
          <span className="tracking-wider">{transaction.referenceNumber}</span>
        </div>
        <div className="flex justify-between mb-1.5">
          <span className="font-semibold">Order ID:</span>
          <span>{formatOrderId(transaction.orderId)}</span>
        </div>
        <div className="flex justify-between mb-1.5">
          <span className="font-semibold">Customer:</span>
          <span>{transaction.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Date & Time:</span>
          <span className="text-right">{formatDateTime(transaction.paymentDate, transaction.paymentTime)}</span>
        </div>
      </div>

      {/* Items */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-4">
        <div className="font-semibold text-center mb-2 pb-2 border-b border-gray-300">
          ITEMS PURCHASED
        </div>
        {transaction.items?.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between">
              <span className="flex-1">
                {item.product_details?.name || item.service_details?.name || 'Item'} x{item.quantity}
              </span>
              <span className="font-semibold ml-2">₱{(parsePrice(item.price) * item.quantity).toFixed(2)}</span>
            </div>
            <div className="text-[10px] text-gray-600 flex justify-between">
              <span>@₱{parsePrice(item.price).toFixed(2)} each</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-b-2 border-gray-400 pb-3 mb-4">
        <div className="flex justify-between mb-1 text-[11px]">
          <span>SUBTOTAL:</span>
          <span className="font-semibold">₱{transaction.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2 text-[11px]">
          <span>TAX (12% VAT):</span>
          <span className="font-semibold">₱{transaction.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold bg-gray-100 p-1.5 rounded">
          <span>TOTAL:</span>
          <span>₱{transaction.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="border-b-2 border-gray-400 pb-3 mb-4">
        <div className="flex justify-between mb-1.5 text-[11px]">
          <span>AMOUNT PAID:</span>
          <span className="font-semibold">₱{transaction.amountPaid.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold bg-green-100 p-1.5 rounded">
          <span>CHANGE:</span>
          <span>₱{transaction.change.toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-1 pt-3">
        <p className="text-[11px] font-semibold">THANK YOU FOR YOUR PURCHASE!</p>
        <p className="text-[10px]">Please keep this receipt for your records</p>
        <p className="text-[10px] mt-1.5">Payment Status: <span className="font-bold text-green-600">COMPLETED</span></p>
        <p className="text-[9px] mt-2 text-gray-500">
          {new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
}
