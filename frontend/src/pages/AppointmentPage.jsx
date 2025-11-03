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
  
  // Form data
  const [selectedService, setSelectedService] = useState(null);
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
    setStep(2);
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
        branch: selectedBranch,
        appointment_date: selectedDate,
        start_time: selectedTimeSlot.start_time,
        notes: notes
      });
      
      toast.showToast('Appointment booked successfully!', 'success');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toast />

      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-accent-cream mb-2">Book an Appointment</h1>
          <p className="text-accent-cream">Schedule a service for your pet</p>
        </div>
        <div className="flex gap-3">
          {user && user.is_staff && (
            <button
              onClick={() => navigate('/admin/appointments')}
              className="px-6 py-3 bg-secondary text-accent-cream rounded-lg hover:bg-secondary-light flex items-center gap-2 shadow-md font-semibold transition-colors"
            >
              <FaCalendar />
              Admin: All Appointments
            </button>
          )}
          <button
            onClick={() => navigate('/my-appointments')}
            className="px-6 py-3 bg-secondary text-accent-cream rounded-lg hover:bg-secondary-light flex items-center gap-2 shadow-md font-semibold transition-colors"
          >
            <FaCalendar />
            Upcoming Appointments
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-center">
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

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold text-accent-cream mb-6">Select a Service</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="bg-primary-dark rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-primary hover:border-secondary"
                >
                  <h3 className="text-xl font-bold text-accent-cream mb-2">{service.service_name}</h3>
                  <p className="text-accent-cream mb-4 line-clamp-3">{service.description}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-accent-cream mb-2">
                    <FaClock />
                    <span>Duration: {formatDuration(service.duration_minutes)}</span>
                  </div>
                  
                  {service.inclusions && service.inclusions.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-accent-cream mb-2">Inclusions:</p>
                      <ul className="text-sm text-accent-cream space-y-1">
                        {service.inclusions.slice(0, 3).map((inclusion, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <FaCheck className="text-secondary-light" size={12} />
                            {inclusion}
                          </li>
                        ))}
                        {service.inclusions.length > 3 && (
                          <li className="text-accent-peach italic">+{service.inclusions.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <button className="mt-4 w-full bg-secondary text-accent-cream py-2 rounded-lg hover:bg-secondary-light transition-colors font-semibold">
                    Select Service
                  </button>
                </div>
              ))}
            </div>
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
                setSelectedDate('');
                setSelectedTimeSlot(null);
                setAvailableSlots([]);
              }}
              className="px-4 py-2 bg-secondary text-accent-cream rounded-lg hover:bg-secondary-light flex items-center gap-2 shadow-md transition-colors"
            >
              ← Back to Services
            </button>
          </div>

          <h2 className="text-2xl font-bold text-accent-cream mb-2">Select Date & Time</h2>
          <p className="text-accent-cream mb-6">Service: <span className="font-semibold">{selectedService.service_name}</span> ({formatDuration(selectedService.duration_minutes)})</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Branch Selection */}
            <div className="bg-primary-dark rounded-lg shadow-md p-6 border-2 border-primary">
              <label className="block text-sm font-medium text-accent-cream mb-2">
                <FaMapMarkerAlt className="inline mr-2" />
                Select Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-2 border-2 border-primary bg-primary text-accent-cream rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
              >
                <option value="Matina">Matina</option>
                <option value="Toril">Toril</option>
              </select>
            </div>

            {/* Date Selection */}
            <div className="bg-primary-dark rounded-lg shadow-md p-6 border-2 border-primary">
              <label className="block text-sm font-medium text-accent-cream mb-2">
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
                className="w-full px-4 py-2 border-2 border-primary bg-primary text-accent-cream rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
              />
            </div>

            {/* Pet Selection (Optional) - Gallery View */}
            <div className="bg-primary-dark rounded-lg shadow-md p-6 lg:col-span-2 border-2 border-primary">
              <label className="block text-sm font-medium text-accent-cream mb-4">
                <FaPaw className="inline mr-2" />
                Select Pet (Optional)
              </label>
              
              {pets.length === 0 ? (
                <div className="text-center py-8 text-accent-cream">
                  <FaPaw className="mx-auto mb-2" size={32} />
                  <p>No pets found. You can still book without selecting a pet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {/* No Pet Option */}
                  <div
                    onClick={() => setSelectedPet(null)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      !selectedPet
                        ? 'border-secondary bg-primary text-accent-cream shadow-md'
                        : 'border-primary hover:border-secondary hover:bg-primary'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <FaPaw className="text-accent-cream" size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-accent-cream">No Pet Selected</h4>
                        <p className="text-sm text-accent-cream">Book appointment without a specific pet</p>
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
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPet?.id === pet.id
                          ? 'border-secondary bg-primary text-accent-cream shadow-md'
                          : 'border-primary hover:border-secondary hover:bg-primary'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <PetAvatar imageUrl={pet.pet_picture} size="medium" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-accent-cream">{pet.pet_name}</h4>
                            <GenderIcon gender={pet.gender} size={16} />
                          </div>
                          <p className="text-sm text-accent-cream">{pet.breed}</p>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-accent-cream">
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
            <div className="bg-primary-dark rounded-lg shadow-md p-6 border-2 border-primary">
              <h3 className="text-lg font-bold text-accent-cream mb-4">
                <FaClock className="inline mr-2" />
                Available Time Slots
              </h3>
              <p className="text-sm text-accent-cream mb-4">Business hours: 8:00 AM - 5:00 PM</p>

              {loadingSlots ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 text-accent-cream">
                  <FaTimes className="mx-auto mb-2" size={32} />
                  <p>No available slots for this date. Please choose another date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => handleTimeSlotSelect(slot)}
                      className="px-4 py-3 border-2 border-primary rounded-lg hover:bg-primary hover:border-secondary transition-colors text-sm text-accent-cream font-semibold hover:text-accent-cream"
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
              className="text-secondary hover:text-secondary-light flex items-center gap-2 font-semibold transition-colors"
            >
              ← Back to Date & Time
            </button>
          </div>

          <h2 className="text-2xl font-bold text-accent-cream mb-6">Confirm Appointment</h2>

          <div className="bg-primary-dark rounded-lg shadow-md p-6 mb-6 border-2 border-primary">
            <h3 className="text-lg font-bold text-accent-cream mb-6">Appointment Details</h3>
            
            <div className="space-y-0 border-2 border-primary rounded-lg overflow-hidden">
              {/* Service Row */}
              <div className="flex justify-between items-center px-6 py-4 border-b-2 border-primary hover:bg-primary transition-colors bg-primary-darker">
                <span className="font-semibold text-accent-cream">Service</span>
                <span className="text-accent-cream font-medium">{selectedService.service_name}</span>
              </div>
              
              {/* Duration Row */}
              <div className="flex justify-between items-center px-6 py-4 border-b-2 border-primary hover:bg-primary transition-colors bg-primary-darker">
                <span className="font-semibold text-accent-cream">Duration</span>
                <span className="text-accent-cream font-medium">{formatDuration(selectedService.duration_minutes)}</span>
              </div>
              
              {/* Branch Row */}
              <div className="flex justify-between items-center px-6 py-4 border-b-2 border-primary hover:bg-primary transition-colors bg-primary-darker">
                <span className="font-semibold text-accent-cream">Branch</span>
                <span className="text-accent-cream font-medium">{selectedBranch}</span>
              </div>
              
              {/* Date Row */}
              <div className="flex justify-between items-center px-6 py-4 border-b-2 border-primary hover:bg-primary transition-colors bg-primary-darker">
                <span className="font-semibold text-accent-cream">Date</span>
                <span className="text-accent-cream font-medium">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              
              {/* Time Row */}
              <div className="flex justify-between items-center px-6 py-4 hover:bg-primary transition-colors bg-primary-darker">
                <span className="font-semibold text-accent-cream">Time</span>
                <span className="text-accent-cream font-medium">{selectedTimeSlot.display}</span>
              </div>
            </div>
            
            {/* Pet Section */}
            {selectedPet && (
              <div className="mt-6 pt-6 border-t-2 border-primary">
                <h4 className="text-base font-bold text-secondary-light mb-4">Selected Pet</h4>
                <div className="border-2 border-secondary rounded-lg p-4 bg-primary">
                  <div className="flex items-center gap-4">
                    <PetAvatar imageUrl={selectedPet.pet_picture} size="small" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-accent-cream text-lg">{selectedPet.pet_name}</span>
                        <GenderIcon gender={selectedPet.gender} size={16} />
                      </div>
                      <div className="space-y-1 text-sm text-accent-cream">
                        <div><span className="text-secondary-light font-medium">Breed:</span> {selectedPet.breed}</div>
                        <div><span className="text-secondary-light font-medium">Age:</span> {formatAge(selectedPet.age_value, selectedPet.age_unit)}</div>
                        <div><span className="text-secondary-light font-medium">Weight:</span> {selectedPet.weight_lbs} lbs</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <label className="block text-sm font-medium text-accent-cream mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border-2 border-primary bg-primary text-accent-cream rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary resize-none"
                placeholder="Any special requests or information..."
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 px-6 py-3 border-2 border-primary rounded-lg text-accent-cream hover:bg-primary hover:border-secondary transition-colors font-semibold"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-secondary text-accent-cream rounded-lg hover:bg-secondary-light disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {submitting ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
