import React, { useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';

export default function AppointmentReceipt({ appointment }) {
  // Log the appointment data for debugging
  useEffect(() => {
    console.log('=== APPOINTMENT DATA DEBUG ===');
    console.log('Full appointment:', appointment);
    console.log('Service details:', appointment.service_details);
    if (appointment.service_details) {
      console.log('Service standalone_price:', appointment.service_details.standalone_price);
      console.log('Service base_price:', appointment.service_details.base_price);
      console.log('Service addon_price:', appointment.service_details.addon_price);
    }
    console.log('Add-ons:', appointment.add_ons);
  }, [appointment]);

  if (!appointment) return null;

  // Helper to safely parse prices
  const parsePrice = (price) => {
    if (price === null || price === undefined || price === '') return 0;
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
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

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    }
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Helper function to get price based on pet weight and service size pricing
  const getServicePrice = () => {
    const service = appointment.service_details;
    
    if (!service) return 0;
    
    // If service has size-based pricing, calculate based on pet weight
    if (service.has_sizes) {
      const petWeight = appointment.pet_details?.weight_lbs || 20; // Default to medium (20 lbs) if no pet
      console.log(`Service has sizes, pet weight: ${petWeight}, defaulted: ${!appointment.pet_details}`);
      
      // Size mapping based on weight
      if (petWeight <= 10) {
        const price = parsePrice(service.small_price);
        console.log(`Size: Small (${petWeight} lbs) -> ${price}`);
        return price;
      } else if (petWeight <= 25) {
        const price = parsePrice(service.medium_price);
        console.log(`Size: Medium (${petWeight} lbs) -> ${price}`);
        return price;
      } else if (petWeight <= 50) {
        const price = parsePrice(service.large_price);
        console.log(`Size: Large (${petWeight} lbs) -> ${price}`);
        return price;
      } else {
        const price = parsePrice(service.extra_large_price);
        console.log(`Size: Extra Large (${petWeight} lbs) -> ${price}`);
        return price;
      }
    }
    
    // Otherwise use standalone_price or base_price
    const price = parsePrice(service.standalone_price ?? service.base_price);
    console.log(`Service no sizes, standalone_price=${service.standalone_price}, base_price=${service.base_price}, using: ${price}`);
    return price;
  };
  
  // Calculate prices - use size-based or standalone pricing
  const servicePrice = getServicePrice();
  const addOnsTotal = (appointment.add_ons || []).reduce((sum, addon) => {
    // Add-ons always use addon_price
    const addonPrice = parsePrice(addon.addon_price ?? addon.standalone_price ?? addon.base_price);
    console.log(`Add-on: ${addon.service_name}, addon_price=${addon.addon_price}, parsed=${addonPrice}`);
    return sum + addonPrice;
  }, 0);
  
  const subtotal = servicePrice + addOnsTotal;
  const tax = subtotal * 0.12; // 12% VAT
  const total = subtotal + tax;
  
  // Logging for debugging
  console.log(`=== Appointment Receipt Pricing ===`);
  console.log(`Service: ${appointment.service_details?.service_name}`);
  console.log(`  has_sizes=${appointment.service_details?.has_sizes}`);
  console.log(`  Pet: ${appointment.pet_details?.pet_name || 'None'} (${appointment.pet_details?.weight_lbs || 'default'} lbs)`);
  console.log(`  servicePrice=${servicePrice}`);
  console.log(`  addOnsTotal=${addOnsTotal}`);
  console.log(`  Subtotal=${subtotal}, Tax=${tax}, Total=${total}`);

  return (
    <div className="bg-white p-4 text-gray-900 font-mono text-xs" style={{ lineHeight: '1.6' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-400 pb-3 mb-4">
        <h1 className="text-base font-bold tracking-wide">CHONKY PET STORE</h1>
        <p className="text-[10px] mt-1">{appointment.branch} Branch</p>
        <p className="text-[10px]">Professional Pet Grooming & Services</p>
      </div>

      {/* Appointment Info */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-4">
        <div className="flex justify-between mb-1.5 text-[11px]">
          <span className="font-semibold">Appointment ID:</span>
          <span className="tracking-wider">APT-{(appointment.id || appointment.appointmentId || '0').toString().padStart(6, '0')}</span>
        </div>
        <div className="flex justify-between mb-1.5 text-[11px]">
          <span className="font-semibold">Customer:</span>
          <span>{appointment.user_details?.first_name} {appointment.user_details?.last_name}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="font-semibold">Contact:</span>
          <span>{appointment.user_details?.email}</span>
        </div>
      </div>

      {/* Pet Information */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-4">
        <div className="font-semibold text-center mb-2 pb-2 border-b border-gray-300">
          PET INFORMATION
        </div>
        {appointment.pet_details && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Pet Name:</span>
              <span className="font-semibold">{appointment.pet_details.name}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Species:</span>
              <span>{appointment.pet_details.species}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Breed:</span>
              <span>{appointment.pet_details.breed || 'N/A'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Service Details */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-4">
        <div className="font-semibold text-center mb-2 pb-2 border-b border-gray-300">
          SERVICE DETAILS
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span>Service:</span>
            <span className="font-semibold">{appointment.service_details?.service_name}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>Duration:</span>
            <span>{formatDuration(appointment.service_details?.duration_minutes)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>Date & Time:</span>
            <span className="text-right">{formatDateTime(appointment.appointment_date, appointment.start_time)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>Location:</span>
            <span>{appointment.branch}</span>
          </div>
        </div>
      </div>

      {/* Items & Pricing */}
      <div className="border-b-2 border-gray-400 pb-3 mb-4">
        <div className="font-semibold text-center mb-2 pb-2 border-b border-gray-300">
          ITEMS & PRICING
        </div>
        
        {/* Debug Info - Remove later */}
        <div className="text-xs bg-yellow-50 border border-yellow-200 p-1 mb-1 rounded hidden">
          <p>Service Price Raw: {appointment.service_details?.standalone_price} | {appointment.service_details?.base_price}</p>
          <p>Service Price Parsed: {servicePrice}</p>
          <p>Add-ons Total: {addOnsTotal}</p>
          <p>Subtotal: {subtotal}</p>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span>{appointment.service_details?.service_name}</span>
            <span className="font-semibold">{formatCurrency(servicePrice)}</span>
          </div>

          {/* Add-ons (if any) */}
          {appointment.add_ons && appointment.add_ons.length > 0 && (
            <div className="border-t border-gray-300 pt-1 mt-1">
              <div className="text-[10px] font-semibold mb-1">Add-ons:</div>
              {appointment.add_ons.map((addon, idx) => {
                const addonPrice = parsePrice(addon.addon_price ?? addon.standalone_price ?? addon.base_price);
                return (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <span>  • {addon.service_name}</span>
                    <span className="font-semibold">{formatCurrency(addonPrice)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="border-b-2 border-gray-400 pb-3 mb-4">
        <div className="flex justify-between mb-1 text-[11px]">
          <span>SUBTOTAL:</span>
          <span className="font-semibold">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between mb-2 text-[11px]">
          <span>TAX (12% VAT):</span>
          <span className="font-semibold">{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold bg-gray-100 p-1.5 rounded mb-3">
          <span>TOTAL:</span>
          <span>{formatCurrency(total)}</span>
        </div>
        
        {/* Payment Information */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold">AMOUNT PAID:</span>
            <span className="font-bold">{formatCurrency(appointment.amount_paid ? parseFloat(appointment.amount_paid) : total)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold">CHANGE:</span>
            <span className="font-bold">{formatCurrency(appointment.change ? parseFloat(appointment.change) : 0)}</span>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      {appointment.notes && (
        <div className="border-b border-dashed border-gray-400 pb-3 mb-4">
          <div className="font-semibold mb-1 text-[11px]">Special Notes:</div>
          <p className="text-[10px] whitespace-pre-wrap">{appointment.notes}</p>
        </div>
      )}

      {/* Status */}
      <div className={`border-2 border-gray-400 rounded p-1.5 mb-4 text-center font-bold text-[11px] ${getStatusColor(appointment.status)}`}>
        Status: {appointment.status.toUpperCase()}
      </div>

      {/* Footer */}
      <div className="text-center space-y-1 pt-3">
        <p className="text-[11px] font-semibold">THANK YOU FOR CHOOSING CHONKY PET STORE!</p>
        <p className="text-[10px]">Please arrive 10 minutes early for your appointment</p>
        <p className="text-[10px] mt-1.5">For cancellations or rescheduling, please contact us at least 24 hours in advance</p>
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

