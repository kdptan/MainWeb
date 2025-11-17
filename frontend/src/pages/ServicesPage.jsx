import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaClock, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import DecorativeBackground from '../components/DecorativeBackground';
import { formatCurrency } from '../utils/formatters';
import servicesHero from '../assets/DOG2.png'; // Assuming you have a services hero image

export default function ServicesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/services/', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to fetch services');
      const data = await res.json();
      setServices(data);
      setFilteredServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const filterServices = useCallback(() => {
    let filtered = [...services];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.service_name.toLowerCase().includes(query) ||
          (s.description && s.description.toLowerCase().includes(query))
      );
    }

    setFilteredServices(filtered);
  }, [services, searchQuery]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    filterServices();
  }, [filterServices]);

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${mins} minute${mins > 1 ? 's' : ''}`;
  };

  return (
    <DecorativeBackground variant="paws">
      <div className="bg-chonky-white min-h-screen">
        {/* Hero Section - Full Width */}
        <section className="bg-chonky-brown pt-16 pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[450px]">
              {/* Left Side: Title and Tagline */}
              <div className="text-left">
                <h1 className="hero-title mb-4">
                  Our Purr-fect Services
                </h1>
                <p className="text-body-lg text-accent-cream leading-relaxed mb-6">
                  Expert care and pampering for your beloved pets.
                </p>
                {/* Search Bar */}
                <div className="bg-primary-dark rounded-3xl shadow-xl p-4 border-2 border-primary">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-chonky-white" />
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-primary border-2 border-primary-dark rounded-3xl focus:ring-2 focus:ring-secondary-light focus:border-secondary-light text-lg text-chonky-white placeholder-chonky-white"
                    />
                  </div>
                  <div className="mt-3 text-sm text-chonky-white text-center">
                    {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} available
                  </div>
                </div>
              </div>
              
              {/* Right: Services Hero Image */}
              <div className="flex justify-center items-end">
                <img 
                  src={servicesHero} 
                  alt="Happy Dog being groomed" 
                  className="max-w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-chonky-khaki">
          {/* Loading State and Service sections */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-lighter"></div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-chonky-white shadow-md">
              <div className="py-8">
                {/* Package Services Section */}
                <div>
                  <h2 className="heading-section text-chonky-poop mb-6">Package Services</h2>
                  
                  {filteredServices.filter(s => !s.is_solo).length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-chonky-poop text-lg">No package services found matching your search.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                      {filteredServices.filter(s => !s.is_solo).map((service) => (
                        <div
                          key={service.id}
                          className="service-card bg-chonky-poop rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col border-2 border-primary"
                          onClick={() => setSelectedService(service)}
                        >
                          {/* Service Header with Cartoon Animal Image */}
                          <div className="relative h-32 overflow-hidden bg-chonky-white flex items-center justify-center">
                            <img 
                              src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${service.service_name}&backgroundColor=4a4a4a&scale=80`}
                              alt="Service mascot"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/20 to-transparent p-4">
                              <h3 className="heading-card group-hover:scale-105 transition-transform line-clamp-2 text-chonky-white">
                                {service.service_name}
                              </h3>
                            </div>
                            <div className="absolute bottom-2 right-2 flex items-center gap-2 text-chonky-white bg-black/30 px-2 py-1 rounded-lg">
                              <FaClock />
                              <span className="text-body font-medium">
                                {formatDuration(service.duration_minutes)}
                              </span>
                            </div>
                          </div>

                          {/* Service Body */}
                          <div className="p-6 flex-1 flex flex-col">
                            {/* Description */}
                            {service.description && (
                              <p className="text-chonky-white mb-4 line-clamp-2 text-body-lg">
                                {service.description}
                              </p>
                            )}

                            {/* Pricing Preview */}
                            <div className="bg-chonky-khaki rounded-3xl p-3 mb-4">
                              {service.has_sizes ? (
                                <div>
                                  <p className="text-body text-chonky-white mb-2">📏 Pricing by Size:</p>
                                  <div className="grid grid-cols-4 gap-1 text-xs">
                                    <div className="text-center">
                                      <p className="text-chonky-white">S</p>
                                      <p className="price price-small text-secondary-lighter">₱{parseFloat(service.small_price).toFixed(0)}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-chonky-white">M</p>
                                      <p className="price price-small text-secondary-lighter">₱{parseFloat(service.medium_price).toFixed(0)}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-chonky-white">L</p>
                                      <p className="price price-small text-secondary-lighter">₱{parseFloat(service.large_price).toFixed(0)}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-chonky-white">XL</p>
                                      <p className="price price-small text-secondary-lighter">₱{parseFloat(service.extra_large_price).toFixed(0)}</p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <p className="text-small text-chonky-white mb-1">💰 Starting at:</p>
                                  <p className="price price-medium text-secondary-lighter">{formatCurrency(service.base_price)}</p>
                                </div>
                              )}
                            </div>

                            {/* Inclusions Preview */}
                            {service.inclusions && service.inclusions.length > 0 && (
                              <div className="mb-4 flex-1">
                                <p className="text-lg font-semibold text-chonky-white mb-2">Includes:</p>
                                <ul className="space-y-1">
                                  {service.inclusions.slice(0, 2).map((inclusion, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-body text-chonky-white">
                                      <FaCheckCircle className="text-secondary-lighter mt-0.5 flex-shrink-0" />
                                      <span className="line-clamp-1">{inclusion}</span>
                                    </li>
                                  ))}
                                  {service.inclusions.length > 2 && (
                                    <li className="text-xs text-secondary-lighter font-medium">
                                      +{service.inclusions.length - 2} more...
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}

                            {/* View Details Button */}
                            <button className="w-full mt-auto bg-secondary text-chonky-white py-2 px-4 rounded-3xl font-semibold hover:bg-btn-yellow hover:text-chonky-brown transition-colors shadow-md text-sm">
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Solo Services / Add-ons Section */}
                <div className="mt-12 pt-8 border-t-2 border-chonky-khaki">
                  <h2 className="heading-section text-chonky-poop mb-6">Add-ons & Solo Services</h2>
                  
                  {filteredServices.filter(s => s.is_solo).length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-chonky-poop text-lg">No add-ons or solo services found matching your search.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredServices.filter(s => s.is_solo).map((service, index) => (
                        <div
                          key={service.id}
                          className="service-card bg-chonky-poop rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col border-2 border-brand-gold"
                          onClick={() => setSelectedService(service)}
                        >
                          {/* Service Header with Cartoon Animal Image */}
                          <div className="relative h-24 overflow-hidden bg-white flex items-center justify-center">
                            <img 
                              src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${service.service_name}-${index}-${service.id}&backgroundColor=4a4a4a&scale=80`}
                              alt="Service mascot"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/20 to-transparent p-2">
                              <h3 className="heading-card group-hover:scale-105 transition-transform line-clamp-1 text-chonky-white text-xs">
                                {service.service_name}
                              </h3>
                            </div>
                            <div className="absolute top-0 right-0 bg-chonky-white/90 px-2 py-1 rounded-bl text-primary-darker text-xs font-semibold shadow-md">
                              {service.can_be_addon && service.can_be_standalone ? '✨ Both' : service.can_be_addon ? '🏷️ Add-on' : '🛍️ Solo'}
                            </div>
                          </div>

                          {/* Service Body */}
                          <div className="p-3 flex-1 flex flex-col">
                            {/* Pricing Preview */}
                            <div className="bg-chonky-khaki rounded-3xl p-2 mb-2">
                              {service.can_be_addon && (
                                <div className="mb-2 pb-2 border-b border-primary-dark">
                                  <p className="text-small text-chonky-white mb-0.5">🏷️ Add-on:</p>
                                  <p className="price text-sm text-brand-gold font-semibold">{formatCurrency(service.addon_price)}</p>
                                </div>
                              )}
                              {service.can_be_standalone && (
                                <div>
                                  <p className="text-small text-chonky-white mb-0.5">🛍️ Solo:</p>
                                  <p className="price text-sm text-brand-gold font-semibold">{formatCurrency(service.standalone_price)}</p>
                                </div>
                              )}
                            </div>

                            {/* View Details Button */}
                            <button className="w-full mt-auto bg-secondary text-chonky-white py-1.5 px-3 rounded-3xl font-semibold hover:bg-btn-yellow hover:text-chonky-brown transition-colors shadow-md text-xs">
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Service Details Modal */}
        {selectedService && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 z-50"
            onClick={() => setSelectedService(null)}
          >
            <div
              className="bg-primary-dark rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-primary"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-secondary p-6 text-chonky-white border-b-2 border-primary">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="heading-main text-chonky-white mb-2">{selectedService.service_name}</h2>
                    <div className="flex items-center gap-2 text-chonky-white">
                      <FaClock />
                      <span className="text-body font-semibold">
                        Duration: {formatDuration(selectedService.duration_minutes)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedService(null)}
                    className="text-chonky-white hover:text-accent-peach text-3xl leading-none"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 bg-primary-darker space-y-6">
                {/* Description */}
                {selectedService.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-chonky-white mb-2">Description</h3>
                    <p className="text-chonky-white leading-relaxed">{selectedService.description}</p>
                  </div>
                )}

                {/* Pricing Section */}
                <div>
                  <h3 className="heading-card text-chonky-white mb-3">Pricing</h3>
                  {selectedService.is_solo ? (
                    <div className="bg-primary-dark rounded-3xl p-4">
                      <p className="text-small text-chonky-white mb-3">✨ Flexible Pricing:</p>
                      <div className="space-y-3">
                        {selectedService.can_be_addon && (
                          <div className="bg-secondary p-4 rounded-3xl">
                            <p className="text-chonky-white text-small mb-2">🏷️ Add-on Price:</p>
                            <p className="price price-large text-brand-gold">{formatCurrency(selectedService.addon_price)}</p>
                          </div>
                        )}
                        {selectedService.can_be_standalone && (
                          <div className="bg-secondary p-4 rounded-3xl">
                            <p className="text-chonky-white text-small mb-2">🛍️ Standalone Price:</p>
                            <p className="price price-large text-brand-gold">{formatCurrency(selectedService.standalone_price)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : selectedService.has_sizes ? (
                    <div className="bg-primary-dark rounded-3xl p-4">
                      <p className="text-small text-chonky-white mb-3">📏 Size-Based Pricing:</p>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-secondary p-3 rounded-3xl text-center">
                          <p className="text-chonky-white text-small mb-1">Small</p>
                          <p className="price price-medium text-secondary-lighter">₱{parseFloat(selectedService.small_price).toFixed(0)}</p>
                        </div>
                        <div className="bg-secondary p-3 rounded-3xl text-center">
                          <p className="text-chonky-white text-small mb-1">Medium</p>
                          <p className="price price-medium text-secondary-lighter">₱{parseFloat(selectedService.medium_price).toFixed(0)}</p>
                        </div>
                        <div className="bg-secondary p-3 rounded-3xl text-center">
                          <p className="text-chonky-white text-small mb-1">Large</p>
                          <p className="price price-medium text-secondary-lighter">₱{parseFloat(selectedService.large_price).toFixed(0)}</p>
                        </div>
                        <div className="bg-secondary p-3 rounded-3xl text-center">
                          <p className="text-chonky-white text-small mb-1">Extra Large</p>
                          <p className="price price-medium text-secondary-lighter">₱{parseFloat(selectedService.extra_large_price).toFixed(0)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-primary rounded-3xl p-4 text-center">
                      <p className="text-small text-chonky-white mb-2">💰 Base Price</p>
                      <p className="price price-large text-secondary-lighter">{formatCurrency(selectedService.base_price)}</p>
                    </div>
                  )}
                </div>

                {/* Inclusions */}
                {selectedService.inclusions && selectedService.inclusions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-chonky-white mb-3">What's Included</h3>
                    <ul className="space-y-2">
                      {selectedService.inclusions.map((inclusion, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <FaCheckCircle className="text-btn-yellow mt-1 flex-shrink-0" />
                          <span className="text-chonky-white">{inclusion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Book Now Button */}
                <div className="pt-6 border-t border-primary">
                  <button 
                    onClick={() => {
                      setSelectedService(null);
                      navigate('/appointment', { 
                        state: { selectedService: selectedService }
                      });
                    }}
                    className="w-full bg-secondary text-chonky-white py-3 px-6 rounded-3xl font-bold text-lg hover:bg-btn-yellow hover:text-chonky-brown transition-colors shadow-md"
                  >
                    Book This Service
                  </button>
                  <p className="text-center text-sm text-chonky-white mt-2">
                    Contact us to schedule an appointment
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DecorativeBackground>
  );
}
