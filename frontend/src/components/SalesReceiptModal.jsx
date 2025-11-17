import React, { useRef, useEffect } from 'react';
import { FaTimes, FaPrint } from 'react-icons/fa';
import TransactionReceipt from './TransactionReceipt';
import AppointmentReceipt from './AppointmentReceipt';

export default function SalesReceiptModal({ isOpen, onClose, receiptData }) {
  const receiptRef = useRef(null);
  const modalRef = useRef(null);

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

  if (!isOpen || !receiptData) return null;

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write(receiptRef.current.innerHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };


  // Determine the receipt title based on type
  const getReceiptTitle = () => {
    switch (receiptData.type) {
      case 'sale':
        return 'POS Receipt';
      case 'order':
        return 'Order Receipt';
      case 'appointment':
        return 'Appointment Confirmation';
      default:
        return 'Receipt';
    }
  };

  // Format sale data for TransactionReceipt component
  const formatSaleForReceipt = (sale) => {
    // Transform items to have consistent structure with product_details/service_details
    const formattedItems = sale.items?.map(item => ({
      ...item,
      product_details: item.product_details ? { name: item.product_details.name } : null,
      service_details: item.service_details ? { name: item.service_details.name } : null,
      price: parseFloat(item.unit_price || 0),
    })) || [];
    
    return {
      referenceNumber: sale.sale_number,
      orderId: sale.id,
      customerName: sale.customer_name,
      paymentDate: sale.sale_date,
      paymentTime: new Date(sale.sale_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      branch: sale.branch,
      paymentMethod: sale.payment_method,
      items: formattedItems,
      subtotal: parseFloat(sale.subtotal || 0),
      tax: parseFloat(sale.tax || 0),
      total: parseFloat(sale.total || 0),
      amountPaid: parseFloat(sale.amount_paid || 0),
      change: parseFloat(sale.change || 0),
    };
  };

  // Format order data for TransactionReceipt component
  const formatOrderForReceipt = (order) => {
    const subtotal = parseFloat(order.total_price || 0);
    const tax = subtotal * 0.12; // 12% VAT
    const total = subtotal + tax;
    
    // Transform items to match TransactionReceipt's expected structure
    const formattedItems = order.items?.map(item => ({
      ...item,
      product_details: item.product_details ? { name: item.product_details.name } : null,
      service_details: item.service_details ? { name: item.service_details.name } : null,
    })) || [];
    
    // Check for payment data in sessionStorage
    const sessionPayment = sessionStorage.getItem(`orderPayment_${order.id}`);
    const paymentFromSession = sessionPayment ? JSON.parse(sessionPayment) : null;
    
    // Use amount_paid and change from order first, then fall back to sessionStorage
    // If amount_paid is 0, default to total (customer paid full amount)
    const amountPaid = parseFloat(order.amount_paid) > 0 ? parseFloat(order.amount_paid) : (paymentFromSession?.amount_paid || total);
    const change = parseFloat(order.change) > 0 ? parseFloat(order.change) : (paymentFromSession?.change || 0);
    
    return {
      referenceNumber: order.order_id,
      orderId: order.id,
      customerName: order.user.first_name || order.user.username,
      paymentDate: order.completed_at || order.created_at,
      paymentTime: new Date(order.completed_at || order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      branch: order.branch,
      paymentMethod: 'Online Order',
      items: formattedItems,
      subtotal: subtotal,
      tax: tax,
      total: total,
      amountPaid: amountPaid,
      change: change,
      status: order.status,
    };
  };

  // Format appointment data for AppointmentReceipt component
  // This can receive either an appointment object from API or a transaction object from sales report
  const formatAppointmentForReceipt = (data) => {
    // Check if this is a transaction object (from sales report) or appointment object (from API)
    const isTransaction = data.appointmentId || data.amountPaid !== undefined;
    
    if (isTransaction) {
      // This is a transaction object - reconstruct appointment-like data from it
      return {
        id: data.appointmentId,
        service: null,
        service_details: {
          service_name: data.itemName?.replace(' (Add-on)', '') || 'Service',
          duration_minutes: 0,
          has_sizes: false,
        },
        user: null,
        user_details: {
          first_name: (data.customerName || '').split(' ')[0],
          last_name: (data.customerName || '').split(' ').slice(1).join(' '),
          email: data.customerEmail,
          username: data.customerName,
        },
        pet_details: {
          name: data.petName || 'Pet',
        },
        add_ons: [],
        status: data.status,
        updated_at: new Date().toISOString(),
        appointment_date: data.appointmentDate,
        start_time: data.appointmentTime,
        branch: data.branch,
        notes: '',
        amount_paid: data.amountPaid,
        change: data.change,
      };
    }
    
    // Original logic for API appointment objects
    return {
      id: data.id,
      service: data.service,
      service_details: data.service_details,
      user: data.user,
      user_details: data.user_details,
      pet_details: data.pet_details,
      add_ons: data.add_ons,
      status: data.status,
      updated_at: data.updated_at,
      appointment_date: data.appointment_date,
      start_time: data.start_time,
      branch: data.branch,
      notes: data.notes,
      amount_paid: data.amount_paid,
      change: data.change,
    };
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
            <h2 className="text-sm font-bold text-gray-900">{getReceiptTitle()}</h2>
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
            {receiptData.type === 'sale' && (
              <TransactionReceipt transaction={formatSaleForReceipt(receiptData.data)} />
            )}
            
            {receiptData.type === 'order' && (
              <TransactionReceipt transaction={formatOrderForReceipt(receiptData.data)} />
            )}
            
            {receiptData.type === 'appointment' && (
              <AppointmentReceipt appointment={formatAppointmentForReceipt(receiptData.data)} />
            )}
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
