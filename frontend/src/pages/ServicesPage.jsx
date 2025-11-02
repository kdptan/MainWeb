import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaClock, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

export default function ServicesPage() {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-accent-cream mb-2">Our Services</h1>
        <p className="text-accent-cream text-lg">Professional pet care services tailored to your needs</p>
      </div>

      {/* Search Bar */}
      <div className="bg-primary-dark rounded-lg shadow-xl p-4 mb-8 border-2 border-primary">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent-cream" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-primary border-2 border-primary-dark rounded-lg focus:ring-2 focus:ring-secondary-light focus:border-secondary-light text-lg text-accent-cream placeholder-accent-cream"
            />
          </div>
          <div className="mt-3 text-sm text-accent-cream text-center">
            {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} available
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-lighter"></div>
        </div>
      ) : (
        <>
          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-accent-cream text-lg">No services found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="service-card bg-primary-dark rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col border-2 border-primary"
                  onClick={() => setSelectedService(service)}
                >
                  {/* Service Header */}
                  <div className="bg-gradient-to-br from-secondary to-secondary-light p-6 text-white h-32 flex flex-col justify-between">
                    <h3 className="text-2xl font-bold group-hover:scale-105 transition-transform line-clamp-2 text-accent-cream">
                      {service.service_name}
                    </h3>
                    <div className="flex items-center gap-2 text-accent-cream">
                      <FaClock />
                      <span className="text-sm font-medium">
                        {formatDuration(service.duration_minutes)}
                      </span>
                    </div>
                  </div>

                  {/* Service Body */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Description */}
                    {service.description && (
                      <p className="text-accent-cream mb-4 line-clamp-3">
                        {service.description}
                      </p>
                    )}

                    {/* Inclusions Preview */}
                    {service.inclusions && service.inclusions.length > 0 && (
                      <div className="mb-4 flex-1">
                        <p className="text-sm font-semibold text-accent-cream mb-2">Includes:</p>
                        <ul className="space-y-1">
                          {service.inclusions.slice(0, 3).map((inclusion, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-accent-cream">
                              <FaCheckCircle className="text-secondary-lighter mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{inclusion}</span>
                            </li>
                          ))}
                          {service.inclusions.length > 3 && (
                            <li className="text-sm text-secondary-lighter font-medium">
                              +{service.inclusions.length - 3} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* View Details Button */}
                    <button className="w-full mt-auto bg-secondary text-accent-cream py-2 px-4 rounded-lg font-semibold hover:bg-secondary-light transition-colors shadow-md">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Service Details Modal */}
      {selectedService && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedService.service_name}</h2>
                  <div className="flex items-center gap-2 text-blue-100">
                    <FaClock />
                    <span className="font-medium">
                      Duration: {formatDuration(selectedService.duration_minutes)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-white hover:text-gray-200 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Description */}
              {selectedService.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedService.description}</p>
                </div>
              )}

              {/* Inclusions */}
              {selectedService.inclusions && selectedService.inclusions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Included</h3>
                  <ul className="space-y-2">
                    {selectedService.inclusions.map((inclusion, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{inclusion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Book Now Button */}
              <div className="mt-8 pt-6 border-t">
                <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors">
                  Book This Service
                </button>
                <p className="text-center text-sm text-gray-500 mt-2">
                  Contact us to schedule an appointment
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
