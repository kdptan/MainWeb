import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import { formatCurrency } from '../utils/formatters';

export default function AdminServicesPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    service_name: '',
    description: '',
    inclusions: [],
    duration_minutes: 30,
    may_overlap: false,
    has_sizes: false,
    base_price: '',
    small_price: '',
    medium_price: '',
    large_price: '',
    extra_large_price: '',
  });

  const [newInclusion, setNewInclusion] = useState('');

  useEffect(() => {
    if (!user || !user.is_staff) {
      navigate('/');
      return;
    }

    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://127.0.0.1:8000/api/services/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        toast.showToast('Failed to load services', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [user, token, navigate, toast]);

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        service_name: service.service_name,
        description: service.description,
        inclusions: service.inclusions || [],
        duration_minutes: service.duration_minutes,
        may_overlap: service.may_overlap,
        has_sizes: service.has_sizes,
        base_price: service.base_price,
        small_price: service.small_price,
        medium_price: service.medium_price,
        large_price: service.large_price,
        extra_large_price: service.extra_large_price,
      });
    } else {
      setEditingService(null);
      setFormData({
        service_name: '',
        description: '',
        inclusions: [],
        duration_minutes: 30,
        may_overlap: false,
        has_sizes: false,
        base_price: '',
        small_price: '',
        medium_price: '',
        large_price: '',
        extra_large_price: '',
      });
    }
    setNewInclusion('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setNewInclusion('');
  };

  const handleAddInclusion = () => {
    if (newInclusion.trim()) {
      setFormData({
        ...formData,
        inclusions: [...formData.inclusions, newInclusion.trim()],
      });
      setNewInclusion('');
    }
  };

  const handleRemoveInclusion = (index) => {
    setFormData({
      ...formData,
      inclusions: formData.inclusions.filter((_, i) => i !== index),
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.service_name.trim() || !formData.description.trim()) {
      toast.showToast('Service name and description are required', 'error');
      return;
    }

    if (formData.duration_minutes <= 0) {
      toast.showToast('Duration must be greater than 0', 'error');
      return;
    }

    if (formData.has_sizes) {
      if (
        !formData.small_price ||
        !formData.medium_price ||
        !formData.large_price ||
        !formData.extra_large_price
      ) {
        toast.showToast('All size prices are required when size pricing is enabled', 'error');
        return;
      }
    } else {
      if (!formData.base_price) {
        toast.showToast('Base price is required', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const method = editingService ? 'PUT' : 'POST';
      const url = editingService
        ? `http://127.0.0.1:8000/api/services/${editingService.id}/`
        : 'http://127.0.0.1:8000/api/services/';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        if (editingService) {
          setServices(services.map((s) => (s.id === data.id ? data : s)));
          toast.showToast('Service updated successfully', 'success');
        } else {
          setServices([...services, data]);
          toast.showToast('Service created successfully', 'success');
        }
        handleCloseModal();
      } else {
        const error = await res.json();
        toast.showToast(error.detail || 'Failed to save service', 'error');
      }
    } catch (err) {
      console.error('Error saving service:', err);
      toast.showToast('Error saving service', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/services/${serviceId}/`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setServices(services.filter((s) => s.id !== serviceId));
          toast.showToast('Service deleted successfully', 'success');
        } else {
          toast.showToast('Failed to delete service', 'error');
        }
      } catch (err) {
        console.error('Error deleting service:', err);
        toast.showToast('Error deleting service', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark py-8">
      <Toast />
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/products')}
              className="bg-secondary hover:bg-secondary-dark text-white rounded-full p-2 transition"
            >
              <FaArrowLeft size={20} />
            </button>
            <h1 className="display-md text-accent-cream">Services Management</h1>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-secondary hover:bg-secondary-dark text-white px-6 py-3 rounded-3xl flex items-center gap-2 transition"
          >
            <FaPlus size={18} />
            Add Service
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-lighter"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-primary-dark rounded-3xl p-8 text-center text-accent-cream">
            <p className="text-xl mb-4">No services yet. Create your first service!</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-secondary hover:bg-secondary-dark text-white px-6 py-3 rounded-3xl inline-flex items-center gap-2 transition"
            >
              <FaPlus size={18} />
              Create Service
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-primary-dark rounded-3xl p-6 border-2 border-secondary">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="heading-card text-accent-cream">{service.service_name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(service)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-3xl transition"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-3xl transition"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-accent-cream text-sm mb-4">{service.description}</p>

                {/* Duration */}
                <div className="mb-3">
                  <span className="text-accent-cream font-semibold">Duration:</span>
                  <span className="text-accent-cream ml-2">
                    {Math.floor(service.duration_minutes / 60)}h{' '}
                    {service.duration_minutes % 60}m
                  </span>
                </div>

                {/* Pricing */}
                <div className="mb-3">
                  <span className="text-accent-cream font-semibold">Pricing:</span>
                  {service.has_sizes ? (
                    <div className="mt-2 space-y-1 text-sm text-accent-cream">
                      <div>Small: {formatCurrency(service.small_price)}</div>
                      <div>Medium: {formatCurrency(service.medium_price)}</div>
                      <div>Large: {formatCurrency(service.large_price)}</div>
                      <div>Extra Large: {formatCurrency(service.extra_large_price)}</div>
                    </div>
                  ) : (
                    <span className="text-accent-cream ml-2">{formatCurrency(service.base_price)}</span>
                  )}
                </div>

                {/* Inclusions */}
                {service.inclusions && service.inclusions.length > 0 && (
                  <div className="mb-3">
                    <span className="text-accent-cream font-semibold">Inclusions:</span>
                    <ul className="mt-2 list-disc list-inside text-sm text-accent-cream">
                      {service.inclusions.map((inclusion, idx) => (
                        <li key={idx}>{inclusion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Overlapping */}
                <div className="text-sm text-accent-cream">
                  {service.may_overlap ? '✓ Multiple bookings allowed' : '✗ No overlapping bookings'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 z-50">
          <div className="bg-primary-dark rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-secondary">
            <div className="flex justify-between items-center mb-6">
              <h2 className="heading-main text-accent-cream">
                {editingService ? 'Edit Service' : 'Create Service'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-accent-cream hover:text-white transition"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service Name */}
              <div>
                <label className="block text-accent-cream font-semibold mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  name="service_name"
                  value={formData.service_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Dog Grooming"
                  className="w-full px-4 py-2 rounded-3xl bg-primary border-2 border-secondary text-accent-cream placeholder-gray-400 focus:outline-none focus:border-secondary-light"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-accent-cream font-semibold mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Service description..."
                  rows="3"
                  className="w-full px-4 py-2 rounded-3xl bg-primary border-2 border-secondary text-accent-cream placeholder-gray-400 focus:outline-none focus:border-secondary-light"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-accent-cream font-semibold mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-2 rounded-3xl bg-primary border-2 border-secondary text-accent-cream placeholder-gray-400 focus:outline-none focus:border-secondary-light"
                />
              </div>

              {/* May Overlap */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="may_overlap"
                  checked={formData.may_overlap}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded"
                />
                <label className="text-accent-cream font-semibold">
                  Allow multiple bookings at the same time
                </label>
              </div>

              {/* Size-Based Pricing Toggle */}
              <div className="bg-primary p-4 rounded-3xl border-2 border-secondary">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    name="has_sizes"
                    checked={formData.has_sizes}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded"
                  />
                  <label className="text-accent-cream font-semibold">
                    Enable Size-Based Pricing
                  </label>
                </div>

                {formData.has_sizes ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-accent-cream text-sm font-semibold mb-1">
                        Small (₱) *
                      </label>
                      <input
                        type="number"
                        name="small_price"
                        value={formData.small_price}
                        onChange={handleInputChange}
                        placeholder="Price for small"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 rounded-3xl bg-primary-dark border-2 border-secondary text-accent-cream placeholder-gray-400 focus:outline-none focus:border-secondary-light"
                      />
                    </div>
                    <div>
                      <label className="block text-accent-cream text-sm font-semibold mb-1">
                        Medium (₱) *
                      </label>
                      <input
                        type="number"
                        name="medium_price"
                        value={formData.medium_price}
                        onChange={handleInputChange}
                        placeholder="Price for medium"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 rounded-3xl bg-primary-dark border-2 border-secondary text-accent-cream placeholder-gray-400 focus:outline-none focus:border-secondary-light"
                      />
                    </div>
                    <div>
                      <label className="block text-accent-cream text-sm font-semibold mb-1">
                        Large (₱) *
                      </label>
                      <input
                        type="number"
                        name="large_price"
                        value={formData.large_price}
                        onChange={handleInputChange}
                        placeholder="Price for large"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 rounded-3xl bg-primary-dark border-2 border-secondary text-accent-cream placeholder-gray-400 focus:outline-none focus:border-secondary-light"
                      />
                    </div>
                    <div>
                      <label className="block text-accent-cream text-sm font-semibold mb-1">
                        Extra Large (₱) *
                      </label>
                      <input
                        type="number"
                        name="extra_large_price"
                        value={formData.extra_large_price}
                        onChange={handleInputChange}
                        placeholder="Price for extra large"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 rounded-3xl bg-primary-dark border-2 border-secondary text-accent-cream placeholder-gray-400 focus:outline-none focus:border-secondary-light"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-accent-cream text-sm font-semibold mb-1">
                      Base Price (₱) *
                    </label>
                    <input
                      type="number"
                      name="base_price"
                      value={formData.base_price}
                      onChange={handleInputChange}
                      placeholder="Service price"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 rounded-3xl bg-primary-dark border-2 border-secondary text-accent-cream placeholder-gray-400 focus:outline-none focus:border-secondary-light"
                    />
                  </div>
                )}
              </div>
              {/* Inclusions */}
              <div>
                <label className="block text-accent-cream font-semibold mb-2">
                  Inclusions
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newInclusion}
                    onChange={(e) => setNewInclusion(e.target.value)}
                    placeholder="Add inclusion..."
                    className="flex-1 px-4 py-2 rounded-3xl bg-primary border-2 border-secondary text-accent-cream placeholder-gray-400 focus:outline-none focus:border-secondary-light"
                  />
                  <button
                    type="button"
                    onClick={handleAddInclusion}
                    className="bg-secondary hover:bg-secondary-dark text-white px-4 py-2 rounded-3xl transition"
                  >
                    Add
                  </button>
                </div>
                {formData.inclusions.length > 0 && (
                  <div className="space-y-2">
                    {formData.inclusions.map((inclusion, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-primary p-2 rounded-3xl border border-secondary"
                      >
                        <span className="text-accent-cream">{inclusion}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInclusion(idx)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <FaTimes size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-3xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-secondary hover:bg-secondary-dark text-white px-6 py-3 rounded-3xl transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingService ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
