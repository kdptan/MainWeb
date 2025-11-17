import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaPaw, FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { appointmentService } from '../services/appointmentService';
import Toast from '../components/Toast';
import PetAvatar from '../components/PetAvatar';
import GenderIcon from '../components/GenderIcon';
import { formatAge } from '../utils/formatters';
import DecorativeBackground from '../components/DecorativeBackground';
import { formatCurrency } from '../utils/formatters';

export default function AppointmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  
  const [step, setStep] = useState(1); // 1: Service, 2: Date/Time, 3: Confirm
  const [services, setServices] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddOnsModal, setShowAddOnsModal] = useState(false);
  
  // Form data
  const [selectedService, setSelectedService] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('Matina');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Wait for auth to settle
    const hasToken = localStorage.getItem('access') || sessionStorage.getItem('access');
    if (!user && hasToken) {
      return;
    }

    if (!user) {
      toast.showToast('Please login to book an appointment', 'error');
      navigate('/');
      return;
    }

    fetchServices();
    fetchPets();
    
    // Check if coming from Services page with a selected service
    if (location.state?.selectedService) {
      setSelectedService(location.state.selectedService);
      setStep(2); // Skip to Date/Time selection
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/services/');
      const data = await response.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]); // Set empty array on error
      toast.showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPets = async () => {
    try {
      const token = localStorage.getItem('access') || sessionStorage.getItem('access');
      console.log('Fetching pets with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch('http://127.0.0.1:8000/api/pets/my-pets/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Pets data received:', data);
      
      // API now returns only user's pets, no need to filter
      if (Array.isArray(data)) {
        setPets(data);
        console.log('Set pets count:', data.length);
      } else {
        console.error('Data is not an array:', data);
        setPets([]);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
      setPets([]); // Set empty array on error
      toast.showToast('Failed to load pets', 'error');
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedService) return;
    
    setLoadingSlots(true);
    try {
      const data = await appointmentService.getAvailableSlots(
        selectedDate,
        selectedBranch,
        selectedService.id
      );
      setAvailableSlots(data.available_slots || []);
      
      if (data.available_slots.length === 0) {
        toast.showToast('No available slots for this date. Please choose another date.', 'warning');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.showToast('Failed to load available time slots', 'error');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (step === 2 && selectedDate && selectedService) {
      fetchAvailableSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedBranch, selectedService, step]);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedAddOns([]);
    if (service.is_solo) {
      // Solo services go directly to date/time selection (step 2)
      setStep(2);
    } else {
      // Package services open add-ons modal
      setShowAddOnsModal(true);
    }
  };

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
    setStep(3);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await appointmentService.createAppointment({
        service: selectedService.id,
        pet: selectedPet ? selectedPet.id : null,
        add_ons: selectedAddOns.map(addon => addon.id),
        branch: selectedBranch,
        appointment_date: selectedDate,
        start_time: selectedTimeSlot.start_time,
        notes: notes
      });
      
      toast.showToast('Appointment booked successfully!', 'success');
      
      // Clear the appointment cart from localStorage after successful booking
      localStorage.removeItem('appointmentCart');
      
      navigate('/my-appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.showToast(error.message || 'Failed to book appointment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  return (
    <DecorativeBackground variant="paws">
      <div className="bg-chonky-white min-h-screen">
        <Toast />

        {/* Hero Section */}
        <section className="bg-chonky-brown pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="hero-title mb-4">Book an Appointment</h1>
            <p className="text-body-lg text-accent-cream leading-relaxed mb-8">
              Schedule a service for your beloved pet.
            </p>

            {/* Progress Steps */}
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-secondary text-accent-cream' : 'bg-primary text-accent-cream'}`}>
                  {step > 1 ? <FaCheck /> : '1'}
                </div>
                <div className={`w-24 h-1 ${step >= 2 ? 'bg-secondary' : 'bg-primary'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-secondary text-accent-cream' : 'bg-primary text-accent-cream'}`}>
                  {step > 2 ? <FaCheck /> : '2'}
                </div>
                <div className={`w-24 h-1 ${step >= 3 ? 'bg-secondary' : 'bg-primary'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-secondary text-accent-cream' : 'bg-primary text-accent-cream'}`}>
                  3
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-center gap-4">
              {user && user.is_staff && (
                <button
                  onClick={() => navigate('/admin/appointments')}
                  className="px-6 py-3 rounded-3xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-md border-2 border-secondary text-accent-cream hover:bg-secondary hover:text-chonky-brown"
                >
                  <FaCalendar />
                  Admin: All Appointments
                </button>
              )}
              <button
                onClick={() => navigate('/my-appointments')}
                className="px-6 py-3 rounded-3xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-md border-2 border-secondary text-accent-cream hover:bg-secondary hover:text-chonky-brown"
              >
                <FaCalendar />
                My Upcoming Appointments
              </button>
            </div>

          </div>
        </section>

        <section className="bg-chonky-khaki">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-chonky-white shadow-md">
            <div className="py-8">
              {/* Step 1: Select Service */}
              {step === 1 && (
                <div>
                  <h2 className="heading-section text-chonky-poop mb-6">Select a Service</h2>
                  
                  {loading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
                    </div>
                  ) : (
                    <>
                      {/* Package Services Section */}
                      <div className="mb-12">
                        <h3 className="heading-card text-chonky-brown mb-6">Package Services</h3>
                        {services.filter(s => !s.is_solo).length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-chonky-poop text-lg">No package services available.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {services.filter(s => !s.is_solo).map((service) => (
                              <div
                                key={service.id}
                                onClick={() => handleServiceSelect(service)}
                                className="bg-chonky-poop rounded-3xl shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-primary hover:border-secondary"
                              >
                                <h3 className="heading-card text-accent-cream mb-2">{service.service_name}</h3>
                                <p className="text-accent-cream mb-4 line-clamp-2 text-sm">{service.description}</p>
                                
                                {/* Duration */}
                                <div className="flex items-center gap-2 text-sm text-accent-cream mb-3">
                                  <FaClock />
                                  <span>{formatDuration(service.duration_minutes)}</span>
                                </div>

                                {/* Pricing */}
                                <div className="bg-primary rounded-3xl p-3 mb-3">
                                  {service.has_sizes ? (
                                    <div>
                                      <p className="text-xs font-semibold text-accent-cream mb-2">📏 Pricing by Size:</p>
                                      <div className="grid grid-cols-4 gap-1 text-xs">
                                        <div className="text-center">
                                          <p className="text-accent-peach font-bold">S</p>
                                          <p className="text-secondary-lighter">₱{parseFloat(service.small_price).toFixed(0)}</p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-accent-peach font-bold">M</p>
                                          <p className="text-secondary-lighter">₱{parseFloat(service.medium_price).toFixed(0)}</p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-accent-peach font-bold">L</p>
                                          <p className="text-secondary-lighter">₱{parseFloat(service.large_price).toFixed(0)}</p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-accent-peach font-bold">XL</p>
                                          <p className="text-secondary-lighter">₱{parseFloat(service.extra_large_price).toFixed(0)}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center">
                                      <p className="text-xs font-semibold text-accent-cream mb-1">💰 Starting at:</p>
                                      <p className="text-lg font-bold text-secondary-lighter">{formatCurrency(service.base_price)}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Inclusions */}
                                {service.inclusions && service.inclusions.length > 0 && (
                                  <div className="mt-3 mb-3">
                                    <p className="text-xs font-semibold text-accent-cream mb-2">✨ Includes:</p>
                                    <ul className="text-xs text-accent-cream space-y-1">
                                      {service.inclusions.slice(0, 2).map((inclusion, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                          <FaCheck className="text-btn-yellow" size={10} />
                                          <span className="line-clamp-1">{inclusion}</span>
                                        </li>
                                      ))}
                                      {service.inclusions.length > 2 && (
                                        <li className="text-accent-peach italic">+{service.inclusions.length - 2} more</li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                                
                                <button className="mt-3 w-full bg-secondary text-accent-cream py-2 rounded-3xl hover:bg-btn-yellow transition-colors font-semibold text-sm">
                                  Select Service
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Solo Services / Add-ons Section */}
                      <div className="mt-12 pt-8 border-t-2 border-brand-gold">
                        <h3 className="heading-card text-chonky-brown mb-6">Add-ons & Solo Services</h3>
                        {services.filter(s => s.is_solo).length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-chonky-poop text-lg">No add-ons or solo services available.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {services.filter(s => s.is_solo).map((service) => (
                              <div
                                key={service.id}
                                onClick={() => handleServiceSelect(service)}
                                className="bg-primary-dark rounded-3xl shadow-md p-4 cursor-pointer hover:shadow-xl transition-shadow border-2 border-brand-gold hover:border-accent-peach"
                              >
                                <h4 className="text-sm font-semibold text-accent-cream mb-2 line-clamp-1">{service.service_name}</h4>
                                
                                {/* Service Type Badge */}
                                <div className="text-xs text-brand-gold font-medium mb-3">
                                  {service.can_be_addon && service.can_be_standalone ? '✨ Both' : service.can_be_addon ? '🏷️ Add-on' : '🛍️ Solo'}
                                </div>

                                {/* Pricing */}
                                <div className="bg-primary rounded-3xl p-2 mb-3">
                                  {service.can_be_addon && (
                                    <div className="mb-2 pb-2 border-b border-primary-dark">
                                      <p className="text-xs text-accent-peach mb-0.5">🏷️ Add-on:</p>
                                      <p className="text-sm font-semibold text-brand-gold">{formatCurrency(service.addon_price)}</p>
                                    </div>
                                  )}
                                  {service.can_be_standalone && (
                                    <div>
                                      <p className="text-xs text-accent-peach mb-0.5">🛍️ Solo:</p>
                                      <p className="text-sm font-semibold text-brand-gold">{formatCurrency(service.standalone_price)}</p>
                                    </div>
                                  )}
                                </div>

                                <button className="w-full bg-brand-gold text-primary-darker py-1.5 px-2 rounded-3xl hover:bg-accent-peach transition-colors font-semibold text-xs">
                                  Select
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Select Date & Time */}
              {step === 2 && selectedService && (
                <div>
                  <div className="mb-6">
                    <button
                      onClick={() => {
                        setStep(1);
                        setSelectedService(null);
                        setSelectedAddOns([]);
                        setSelectedDate('');
                        setSelectedTimeSlot(null);
                        setAvailableSlots([]);
                      }}
                      className="px-4 py-2 bg-secondary text-accent-cream rounded-3xl hover:bg-btn-yellow flex items-center gap-2 shadow-md transition-colors"
                    >
                      ← Back to Services
                    </button>
                  </div>
                  <h2 className="heading-card text-chonky-brown mb-2">Select Date & Time</h2>
                  <p className="text-chonky-poop mb-2">Service: <span className="font-semibold">{selectedService.service_name}</span> ({formatDuration(selectedService.duration_minutes)})</p>
                  {selectedAddOns.length > 0 && (
                    <p className="text-accent-peach mb-6">Add-ons: {selectedAddOns.map(a => a.service_name).join(', ')}</p>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Branch Selection */}
                    <div className="bg-white rounded-3xl shadow-md p-6 border-2 border-gray-300">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        <FaMapMarkerAlt className="inline mr-2" />
                        Select Branch
                      </label>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 bg-white text-gray-900 rounded-3xl focus:ring-2 focus:ring-secondary focus:border-secondary"
                      >
                        <option value="Matina">Matina</option>
                        <option value="Toril">Toril</option>
                      </select>
                    </div>

                    {/* Date Selection */}
                    <div className="bg-white rounded-3xl shadow-md p-6 border-2 border-gray-300">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        <FaCalendar className="inline mr-2" />
                        Select Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedTimeSlot(null);
                        }}
                        min={getMinDate()}
                        className="w-full px-4 py-2 border-2 border-gray-300 bg-white text-gray-900 rounded-3xl focus:ring-2 focus:ring-secondary focus:border-secondary"
                      />
                    </div>

                    {/* Pet Selection (Optional) - Gallery View */}
                    <div className="bg-white rounded-3xl shadow-md p-6 lg:col-span-2 border-2 border-gray-300">
                      <label className="block text-sm font-medium text-gray-900 mb-4">
                        <FaPaw className="inline mr-2" />
                        Select Pet (Optional)
                      </label>
                      
                      {pets.length === 0 ? (
                        <div className="text-center py-8 text-gray-700">
                          <FaPaw className="mx-auto mb-2" size={32} />
                          <p>No pets found. You can still book without selecting a pet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {/* No Pet Option */}
                          <div
                            onClick={() => setSelectedPet(null)}
                            className={`border-2 rounded-3xl p-4 cursor-pointer transition-all ${
                              !selectedPet
                                ? 'border-secondary bg-blue-50 text-gray-900 shadow-md'
                                : 'border-gray-300 hover:border-secondary hover:bg-gray-50 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <FaPaw className="text-gray-700" size={24} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">No Pet Selected</h4>
                                <p className="text-sm text-gray-700">Book appointment without a specific pet</p>
                              </div>
                              {!selectedPet && (
                                <FaCheck className="text-secondary-light" size={24} />
                              )}
                            </div>
                          </div>

                          {/* Pet Gallery Cards */}
                          {pets.map((pet) => (
                            <div
                              key={pet.id}
                              onClick={() => setSelectedPet(pet)}
                              className={`border-2 rounded-3xl p-4 cursor-pointer transition-all ${
                                selectedPet?.id === pet.id
                                  ? 'border-secondary bg-blue-50 text-gray-900 shadow-md'
                                  : 'border-gray-300 hover:border-secondary hover:bg-gray-50 text-gray-900'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <PetAvatar imageUrl={pet.pet_picture} size="medium" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900">{pet.pet_name}</h4>
                                    <GenderIcon gender={pet.gender} size={16} />
                                  </div>
                                  <p className="text-sm text-gray-700">{pet.breed}</p>
                                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600">
                                    <span>Age: {formatAge(pet.age_value, pet.age_unit)}</span>
                                    <span>•</span>
                                    <span>Weight: {pet.weight_lbs} lbs</span>
                                    <span>•</span>
                                    <span>Branch: {pet.branch}</span>
                                  </div>
                                </div>
                                {selectedPet?.id === pet.id && (
                                  <FaCheck className="text-secondary-light" size={24} />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Available Time Slots */}
                  {selectedDate && (
                    <div className="bg-white rounded-3xl shadow-md p-6 border-2 border-gray-300">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        <FaClock className="inline mr-2" />
                        Available Time Slots
                      </h3>
                      <p className="text-sm text-gray-700 mb-4">Business hours: 8:00 AM - 5:00 PM</p>

                      {loadingSlots ? (
                        <div className="flex justify-center items-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 text-gray-700">
                          <FaTimes className="mx-auto mb-2" size={32} />
                          <p>No available slots for this date. Please choose another date.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {availableSlots.map((slot, index) => (
                            <button
                              key={index}
                              onClick={() => handleTimeSlotSelect(slot)}
                              className="px-4 py-3 border-2 border-gray-300 rounded-3xl hover:bg-gray-100 hover:border-secondary transition-colors text-sm text-gray-900 font-semibold"
                            >
                              <div className="font-semibold">{slot.display.split(' - ')[0]}</div>
                              <div className="text-xs">to {slot.display.split(' - ')[1]}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Confirm */}
              {step === 3 && selectedService && selectedTimeSlot && (
                <div>
                  <div className="mb-6">
                    <button
                      onClick={() => setStep(2)}
                      className="px-4 py-2 bg-secondary text-accent-cream rounded-3xl hover:bg-btn-yellow flex items-center gap-2 shadow-md transition-colors"
                    >
                      ← Back to Date & Time
                    </button>
                  </div>

                  <h2 className="heading-card text-chonky-brown mb-6">Confirm Appointment</h2>

                  <div className="bg-white rounded-3xl shadow-md p-6 mb-6 border-2 border-gray-300">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Current Appointment Details</h3>
                    
                    <div className="space-y-0 border-2 border-gray-300 rounded-3xl overflow-hidden">
                      {/* Service Row */}
                      <div className="flex justify-between items-center px-6 py-4 border-b-2 border-gray-300 hover:bg-gray-50 transition-colors bg-white">
                        <span className="font-semibold text-gray-900">Service</span>
                        <span className="text-gray-900 font-medium">{selectedService.service_name}</span>
                      </div>
                      
                      {/* Duration Row */}
                      <div className="flex justify-between items-center px-6 py-4 border-b-2 border-gray-300 hover:bg-gray-50 transition-colors bg-white">
                        <span className="font-semibold text-gray-900">Duration</span>
                        <span className="text-gray-900 font-medium">{formatDuration(selectedService.duration_minutes)}</span>
                      </div>
                      
                      {/* Add-ons Row */}
                      {selectedAddOns.length > 0 && (
                        <div className="flex justify-between items-start px-6 py-4 border-b-2 border-gray-300 hover:bg-gray-50 transition-colors bg-white">
                          <span className="font-semibold text-gray-900">Add-ons</span>
                          <div className="text-right">
                            {selectedAddOns.map((addon, idx) => (
                              <div key={idx} className="text-gray-900 font-medium text-sm mb-1">
                                {addon.service_name} ({formatCurrency(addon.addon_price)})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Branch Row */}
                      <div className="flex justify-between items-center px-6 py-4 border-b-2 border-gray-300 hover:bg-gray-50 transition-colors bg-white">
                        <span className="font-semibold text-gray-900">Branch</span>
                        <span className="text-gray-900 font-medium">{selectedBranch}</span>
                      </div>
                      
                      {/* Date Row */}
                      <div className="flex justify-between items-center px-6 py-4 border-b-2 border-gray-300 hover:bg-gray-50 transition-colors bg-white">
                        <span className="font-semibold text-gray-900">Date</span>
                        <span className="text-gray-900 font-medium">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      
                      {/* Time Row */}
                      <div className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 transition-colors bg-white">
                        <span className="font-semibold text-gray-900">Time</span>
                        <span className="text-gray-900 font-medium">{selectedTimeSlot.display}</span>
                      </div>
                    </div>
                    
                    {/* Pet Section */}
                    {selectedPet && (
                      <div className="mt-6 pt-6 border-t-2 border-gray-300">
                        <h4 className="text-base font-bold text-gray-900 mb-4">Selected Pet</h4>
                        <div className="border-2 border-secondary rounded-3xl p-4 bg-blue-50">
                          <div className="flex items-center gap-4">
                            <PetAvatar imageUrl={selectedPet.pet_picture} size="small" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-900 text-lg">{selectedPet.pet_name}</span>
                                <GenderIcon gender={selectedPet.gender} size={16} />
                              </div>
                              <div className="space-y-1 text-sm text-gray-700">
                                <div><span className="text-gray-900 font-medium">Breed:</span> {selectedPet.breed}</div>
                                <div><span className="text-gray-900 font-medium">Age:</span> {formatAge(selectedPet.age_value, selectedPet.age_unit)}</div>
                                <div><span className="text-gray-900 font-medium">Weight:</span> {selectedPet.weight_lbs} lbs</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows="4"
                        className="w-full px-4 py-2 border-2 border-gray-300 bg-white text-gray-900 rounded-3xl focus:ring-2 focus:ring-secondary focus:border-secondary resize-none"
                        placeholder="Any special requests or information..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 px-6 py-3 border-2 border-chonky-poop rounded-3xl text-chonky-poop hover:bg-primary hover:border-secondary hover:text-btn-yellow transition-colors font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-secondary text-accent-cream rounded-3xl hover:bg-btn-yellow hover:text-chonky-brown disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
                    >
                      {submitting ? 'Booking...' : 'Confirm Appointment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Add-ons Modal */}
        {showAddOnsModal && selectedService && !selectedService.is_solo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 z-50" onClick={() => setShowAddOnsModal(false)}>
            <div className="bg-primary-dark rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-chonky-poop" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-chonky-khaki p-6 text-primary-darker border-b-2 border-chonky-poop sticky top-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="heading-main text-chonky-white">Add Optional Add-ons</h2>
                    <p className="text-sm text-btn-yellow font-medium">Base Service: {selectedService.service_name}</p>
                  </div>
                  <button
                    onClick={() => setShowAddOnsModal(false)}
                    className="text-primary-darker hover:text-accent-cream text-3xl leading-none"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 bg-primary-darker space-y-6">
                <p className="text-accent-cream text-sm">Select any add-ons you'd like to include with your service (optional):</p>

                {services.filter(s => s.is_solo && s.can_be_addon).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-accent-cream text-lg">No add-ons available at the moment.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.filter(s => s.is_solo && s.can_be_addon).map((addon) => (
                      <div
                        key={addon.id}
                        className={`p-4 rounded-3xl border-2 cursor-pointer transition-all ${
                          selectedAddOns.some(a => a.id === addon.id)
                            ? 'border-brand-gold bg-primary'
                            : 'border-primary-dark bg-primary-darker hover:border-brand-gold'
                        }`}
                        onClick={() => {
                          if (selectedAddOns.some(a => a.id === addon.id)) {
                            setSelectedAddOns(selectedAddOns.filter(a => a.id !== addon.id));
                          } else {
                            setSelectedAddOns([...selectedAddOns, addon]);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="heading-card text-accent-cream text-sm font-semibold">{addon.service_name}</h4>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedAddOns.some(a => a.id === addon.id)
                              ? 'bg-brand-gold border-brand-gold'
                              : 'border-accent-cream'
                          }`}>
                            {selectedAddOns.some(a => a.id === addon.id) && (
                              <FaCheck className="text-primary-darker text-xs" />
                            )}
                          </div>
                        </div>

                        {/* Service Type Badge */}
                        <div className="text-xs text-brand-gold font-medium mb-2">
                          {addon.can_be_addon && addon.can_be_standalone ? '✨ Both' : addon.can_be_addon ? '🏷️ Add-on' : '🛍️ Solo'}
                        </div>

                        {/* Pricing */}
                        <div className="bg-primary rounded-3xl p-2">
                          {addon.can_be_addon && (
                            <div>
                              <p className="text-xs text-chonky-white mb-0.5">🏷️ Add-on Price:</p>
                              <p className="text-sm font-semibold text-brand-gold">{formatCurrency(addon.addon_price)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Add-ons Summary */}
                {selectedAddOns.length > 0 && (
                  <div className="bg-primary rounded-3xl p-4 border-2 border-brand-gold">
                    <h4 className="text-accent-cream font-semibold mb-3">Selected Add-ons:</h4>
                    <div className="space-y-2">
                      {selectedAddOns.map((addon, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-accent-cream">{addon.service_name}</span>
                          <span className="text-brand-gold font-semibold">{formatCurrency(addon.addon_price)}</span>
                        </div>
                      ))}
                      <div className="border-t border-primary-dark pt-2 mt-2 flex justify-between font-bold">
                        <span className="text-accent-cream">Total Add-ons:</span>
                        <span className="text-brand-gold">{formatCurrency(selectedAddOns.reduce((sum, addon) => sum + parseFloat(addon.addon_price), 0))}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-primary-dark border-t-2 border-chonky-poop p-6 flex gap-3">
                <button
                  onClick={() => setShowAddOnsModal(false)}
                  className="flex-1 bg-primary text-accent-cream py-2 px-4 rounded-3xl hover:bg-primary-dark transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAddOnsModal(false);
                    setStep(2);
                  }}
                  className="flex-1 bg-brand-gold text-primary-darker py-2 px-4 rounded-3xl hover:bg-secondary transition-colors font-semibold"
                >
                  Continue to Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DecorativeBackground>
  );
}
