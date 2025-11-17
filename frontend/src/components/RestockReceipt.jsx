import React from 'react';
import { formatCurrency } from '../utils/formatters';

export default function RestockReceipt({ restockData }) {
  if (!restockData) return null;

  const formatDateTime = (timestamp) => {
    const d = new Date(timestamp);
    const formattedDate = d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${formattedDate} at ${formattedTime}`;
  };

  return (
    <div className="bg-white p-4 text-gray-900 font-mono text-xs" style={{ lineHeight: '1.6' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-400 pb-3 mb-4">
        <h1 className="text-base font-bold tracking-wide">CHONKY PET STORE</h1>
        <p className="text-[10px] mt-1">Inventory Management</p>
        <p className="text-[10px]">Stock Adjustment Receipt</p>
      </div>

      {/* Transaction Info */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-4">
        <div className="flex justify-between mb-1.5">
          <span className="font-semibold">Transaction Date:</span>
          <span className="text-right text-[10px]">{formatDateTime(restockData.timestamp)}</span>
        </div>
        <div className="flex justify-between mb-1.5">
          <span className="font-semibold">Supplier:</span>
          <span className="font-bold">{restockData.supplier}</span>
        </div>
        <div className="flex justify-between mb-1.5">
          <span className="font-semibold">Processed By:</span>
          <span>{restockData.user}</span>
        </div>
      </div>

      {/* Products */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-4">
        <div className="font-semibold text-center mb-2 pb-2 border-b border-gray-300">
          PRODUCTS ADJUSTED
        </div>
        {restockData.products.map((product, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between">
              <span className="flex-1">
                {product.name} x{Math.abs(product.quantity_change)}
              </span>
              <span className="font-semibold ml-2">{formatCurrency(product.total_cost || 0)}</span>
            </div>
            <div className="text-[10px] text-gray-600 flex justify-between">
              <span>@{formatCurrency(product.unit_cost || 0)} each</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-b-2 border-gray-400 pb-3 mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span>Subtotal:</span>
          <span>{formatCurrency(restockData.totalCost)}</span>
        </div>
        <div className="flex justify-between text-xs mb-1.5">
          <span>VAT_Tax:</span>
          <span>{formatCurrency(restockData.totalCost * 0.12)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold bg-gray-100 p-1.5 rounded mb-2">
          <span>TOTAL AMOUNT:</span>
          <span>{formatCurrency(restockData.totalCost * 1.12)}</span>
        </div>
        {restockData.amountPaid !== null && restockData.amountPaid !== undefined && (
          <div className="mt-2 pt-2 border-t border-gray-300">
            <div className="flex justify-between text-xs mb-1">
              <span>Amount Paid:</span>
              <span className="font-semibold">{formatCurrency(restockData.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Change:</span>
              <span className="font-semibold">{formatCurrency(Number(restockData.amountPaid) - (restockData.totalCost * 1.12))}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center space-y-1 pt-3">
        <p className="text-[11px] font-semibold">STOCK ADJUSTMENT COMPLETE</p>
        <p className="text-[10px]">Keep this receipt for your records</p>
        <p className="text-[10px] mt-1.5">Status: <span className="font-bold text-green-600">PROCESSED</span></p>
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
