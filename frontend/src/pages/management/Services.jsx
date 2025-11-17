import React, { useState, useEffect, useRef } from 'react';
import { FaEye, FaEdit, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import { useToast } from '../../hooks/useToast';
import { fetchWithAuth } from '../../services/api';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatCurrency } from '../../utils/formatters';

export default function Services() {
  const { toast, showToast } = useToast();
  const [form, setForm] = useState({
    service_name: '',
    description: '',
    inclusions: [''],
    duration_value: '',
    duration_unit: 'minutes',
    may_overlap: false,
    has_sizes: false,
    base_price: '',
    small_price: '',
    medium_price: '',
    large_price: '',
    extra_large_price: '',
  });
  const [services, setServices] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmEditDialog, setConfirmEditDialog] = useState({ isOpen: false, service: null });
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({ isOpen: false, serviceId: null });
  const [showSoloModal, setShowSoloModal] = useState(false);
  const [soloForm, setSoloForm] = useState({
    service_name: '',
    addon_price: '',
    standalone_price: '',
    can_be_addon: true,
    can_be_standalone: true,
  });

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modalRef = useRef(null);

  // Close modals when clicking outside — keep body scrollable
  useEffect(() => {
    if (!(showViewModal || showEditModal || showSoloModal)) return;
    const handler = (e) => {
      if (!modalRef.current) return;
      if (!modalRef.current.contains(e.target)) {
        setShowViewModal(false);
        setShowEditModal(false);
        setShowSoloModal(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showViewModal, showEditModal, showSoloModal]);

  const formatDuration = (minutes) => {
    if (minutes >= 60) {
      const hours = minutes / 60;
      if (minutes % 60 === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      } else {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs}h ${mins}m`;
      }
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('http://127.0.0.1:8000/api/services/');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      console.log('Services fetched:', data);
      console.log('Solo services:', data.filter(s => s.is_solo));
      console.log('Package services:', data.filter(s => !s.is_solo));
      setServices(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch services.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.service_name.trim()) e.service_name = 'Service name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.duration_value || isNaN(Number(form.duration_value)) || Number(form.duration_value) <= 0) 
      e.duration_value = 'Duration must be a positive number';
    if (form.inclusions.filter(inc => inc.trim()).length === 0) 
      e.inclusions = 'At least one inclusion is required';
    
    // Pricing validation
    if (form.has_sizes) {
      if (!form.small_price || parseFloat(form.small_price) < 0) e.small_price = 'Small price is required';
      if (!form.medium_price || parseFloat(form.medium_price) < 0) e.medium_price = 'Medium price is required';
      if (!form.large_price || parseFloat(form.large_price) < 0) e.large_price = 'Large price is required';
      if (!form.extra_large_price || parseFloat(form.extra_large_price) < 0) e.extra_large_price = 'Extra large price is required';
    } else {
      if (!form.base_price || parseFloat(form.base_price) < 0) e.base_price = 'Base price is required';
    }
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleInclusionChange = (index, value) => {
    const newInclusions = [...form.inclusions];
    newInclusions[index] = value;
    setForm((prev) => ({ ...prev, inclusions: newInclusions }));
  };

  const addInclusion = () => {
    setForm((prev) => ({ ...prev, inclusions: [...prev.inclusions, ''] }));
  };

  const removeInclusion = (index) => {
    if (form.inclusions.length > 1) {
      const newInclusions = form.inclusions.filter((_, i) => i !== index);
      setForm((prev) => ({ ...prev, inclusions: newInclusions }));
    }
  };

  const handleAddService = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      // Convert to minutes for storage
      const durationInMinutes = form.duration_unit === 'hours' 
        ? Math.round(parseFloat(form.duration_value) * 60)
        : parseInt(form.duration_value);

      const payload = {
        service_name: form.service_name.trim(),
        description: form.description.trim(),
        inclusions: form.inclusions.filter(inc => inc.trim()),
        duration_minutes: durationInMinutes,
        may_overlap: form.may_overlap,
        has_sizes: form.has_sizes,
        base_price: form.has_sizes ? '0' : form.base_price,
        small_price: form.has_sizes ? form.small_price : '0',
        medium_price: form.has_sizes ? form.medium_price : '0',
        large_price: form.has_sizes ? form.large_price : '0',
        extra_large_price: form.has_sizes ? form.extra_large_price : '0',
      };

      const res = await fetchWithAuth('http://127.0.0.1:8000/api/services/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      showToast('Service added successfully!', 'success');
      setForm({ 
        service_name: '', 
        description: '', 
        inclusions: [''], 
        duration_value: '', 
        duration_unit: 'minutes', 
        may_overlap: false,
        has_sizes: false,
        base_price: '',
        small_price: '',
        medium_price: '',
        large_price: '',
        extra_large_price: '',
      });
      setErrors({});
      fetchServices();
    } catch (err) {
      console.error(err);
      showToast('Failed to add service.', 'error');
    }
  };

  const handleView = (service) => {
    setSelectedService(service);
    setShowViewModal(true);
  };

  const handleEdit = (service) => {
    // Convert minutes back to user-friendly format
    const minutes = service.duration_minutes;
    let duration_value, duration_unit;
    
    if (minutes >= 60 && minutes % 60 === 0) {
      // Show in hours if it's evenly divisible
      duration_value = minutes / 60;
      duration_unit = 'hours';
    } else {
      // Show in minutes
      duration_value = minutes;
      duration_unit = 'minutes';
    }
    
    setEditForm({
      ...service,
      duration_value,
      duration_unit,
      may_overlap: service.may_overlap || false
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInclusionChange = (index, value) => {
    const newInclusions = [...editForm.inclusions];
    newInclusions[index] = value;
    setEditForm((prev) => ({ ...prev, inclusions: newInclusions }));
  };

  const addEditInclusion = () => {
    setEditForm((prev) => ({ ...prev, inclusions: [...prev.inclusions, ''] }));
  };

  const removeEditInclusion = (index) => {
    if (editForm.inclusions.length > 1) {
      const newInclusions = editForm.inclusions.filter((_, i) => i !== index);
      setEditForm((prev) => ({ ...prev, inclusions: newInclusions }));
    }
  };

  const saveEdit = async () => {
    try {
      // Convert to minutes for storage
      const durationInMinutes = editForm.duration_unit === 'hours' 
        ? Math.round(parseFloat(editForm.duration_value) * 60)
        : parseInt(editForm.duration_value);

      const payload = {
        service_name: editForm.service_name,
        description: editForm.description,
        inclusions: editForm.inclusions.filter(inc => inc.trim()),
        duration_minutes: durationInMinutes,
        may_overlap: editForm.may_overlap,
        has_sizes: editForm.has_sizes,
        base_price: editForm.has_sizes ? '0' : editForm.base_price,
        small_price: editForm.has_sizes ? editForm.small_price : '0',
        medium_price: editForm.has_sizes ? editForm.medium_price : '0',
        large_price: editForm.has_sizes ? editForm.large_price : '0',
        extra_large_price: editForm.has_sizes ? editForm.extra_large_price : '0',
      };

      const res = await fetchWithAuth(`http://127.0.0.1:8000/api/services/${editForm.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      showToast('Service updated successfully!', 'success');
      setShowEditModal(false);
      setConfirmEditDialog({ isOpen: false, service: null });
      fetchServices();
    } catch (err) {
      console.error(err);
      showToast('Failed to update service.', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetchWithAuth(`http://127.0.0.1:8000/api/services/${id}/`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error(await res.text());

      showToast('Service deleted successfully!', 'success');
      fetchServices();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete service.', 'error');
    } finally {
      setConfirmDeleteDialog({ isOpen: false, serviceId: null });
    }
  };

  const handleSoloServiceSubmit = async () => {
    if (!soloForm.service_name.trim()) {
      showToast('Service name is required', 'error');
      return;
    }
    
    // Validate prices based on what's selected
    if (soloForm.can_be_addon && (!soloForm.addon_price || parseFloat(soloForm.addon_price) < 0)) {
      showToast('Add-on price is required', 'error');
      return;
    }
    if (soloForm.can_be_standalone && (!soloForm.standalone_price || parseFloat(soloForm.standalone_price) < 0)) {
      showToast('Standalone price is required', 'error');
      return;
    }
    if (!soloForm.can_be_addon && !soloForm.can_be_standalone) {
      showToast('Service must be either an add-on or standalone (or both)', 'error');
      return;
    }

    try {
      const payload = {
        service_name: soloForm.service_name,
        description: `Solo add-on service`, // Default description for solo services
        inclusions: [],
        duration_minutes: 0, // Solo services don't have duration
        may_overlap: true,
        is_solo: true,
        can_be_addon: soloForm.can_be_addon,
        can_be_standalone: soloForm.can_be_standalone,
        addon_price: soloForm.can_be_addon ? soloForm.addon_price : '0',
        standalone_price: soloForm.can_be_standalone ? soloForm.standalone_price : '0',
        has_sizes: false,
        base_price: '0',
        small_price: '0',
        medium_price: '0',
        large_price: '0',
        extra_large_price: '0',
      };

      const res = await fetchWithAuth('http://127.0.0.1:8000/api/services/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      showToast('Solo service added successfully!', 'success');
      setSoloForm({ service_name: '', addon_price: '', standalone_price: '', can_be_addon: true, can_be_standalone: true });
      setShowSoloModal(false);
      console.log('Solo service created, refetching services...');
      fetchServices();
    } catch (err) {
      console.error('Error creating solo service:', err);
      showToast('Failed to create solo service', 'error');
    }
  };

  return (
    <div className="p-6 min-h-screen bg-accent-cream">
      <h1 className="heading-main mb-4 text-primary-darker">Services Management</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: input form */}
        <div className="flex-1 bg-white rounded shadow p-4 border-2 border-primary">
          <h2 className="text-lg font-semibold mb-3 text-primary-darker">Add Service</h2>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium">Service Name</label>
              <input
                name="service_name"
                value={form.service_name}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-2 py-1"
                placeholder="e.g., Pet Grooming"
              />
              {errors.service_name && <div className="text-red-600 text-sm">{errors.service_name}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 w-full border rounded px-2 py-1"
                placeholder="Describe the service..."
              />
              {errors.description && <div className="text-red-600 text-sm">{errors.description}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Inclusions</label>
              {form.inclusions.map((inclusion, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    value={inclusion}
                    onChange={(e) => handleInclusionChange(index, e.target.value)}
                    className="flex-1 border rounded px-2 py-1"
                    placeholder="e.g., Bath and blow dry"
                  />
                  {form.inclusions.length > 1 && (
                    <button
                      onClick={() => removeInclusion(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaMinus />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addInclusion}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                <FaPlus /> Add Inclusion
              </button>
              {errors.inclusions && <div className="text-red-600 text-sm">{errors.inclusions}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium">Duration</label>
              <div className="flex gap-2 mt-1">
                <input
                  name="duration_value"
                  value={form.duration_value}
                  onChange={handleChange}
                  className="flex-1 border rounded px-2 py-1"
                  placeholder="e.g., 30"
                  type="number"
                  step="1"
                  min="1"
                />
                <select
                  name="duration_unit"
                  value={form.duration_unit}
                  onChange={handleChange}
                  className="border rounded px-2 py-1"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
              {errors.duration_value && <div className="text-red-600 text-sm">{errors.duration_value}</div>}
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="may_overlap"
                  checked={form.may_overlap}
                  onChange={(e) => setForm(prev => ({ ...prev, may_overlap: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium">May Overlap</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Allow multiple customers to book this service at the same time
              </p>
            </div>

            {/* Size-Based Pricing Section */}
            <div className="mt-6 p-4 bg-gray-50 rounded border-2 border-gray-200">
              <label className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  name="has_sizes"
                  checked={form.has_sizes}
                  onChange={(e) => setForm(prev => ({ ...prev, has_sizes: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Enable Size-Based Pricing</span>
              </label>

              {form.has_sizes ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Small Price (₱) *</label>
                    <input
                      type="number"
                      name="small_price"
                      value={form.small_price}
                      onChange={(e) => setForm(prev => ({ ...prev, small_price: e.target.value }))}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.small_price && <p className="text-xs text-red-600">{errors.small_price}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Medium Price (₱) *</label>
                    <input
                      type="number"
                      name="medium_price"
                      value={form.medium_price}
                      onChange={(e) => setForm(prev => ({ ...prev, medium_price: e.target.value }))}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.medium_price && <p className="text-xs text-red-600">{errors.medium_price}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Large Price (₱) *</label>
                    <input
                      type="number"
                      name="large_price"
                      value={form.large_price}
                      onChange={(e) => setForm(prev => ({ ...prev, large_price: e.target.value }))}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.large_price && <p className="text-xs text-red-600">{errors.large_price}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Extra Large Price (₱) *</label>
                    <input
                      type="number"
                      name="extra_large_price"
                      value={form.extra_large_price}
                      onChange={(e) => setForm(prev => ({ ...prev, extra_large_price: e.target.value }))}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.extra_large_price && <p className="text-xs text-red-600">{errors.extra_large_price}</p>}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Base Price (₱) *</label>
                  <input
                    type="number"
                    name="base_price"
                    value={form.base_price}
                    onChange={(e) => setForm(prev => ({ ...prev, base_price: e.target.value }))}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.base_price && <p className="text-xs text-red-600">{errors.base_price}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={handleAddService} className="bg-blue-600 text-white px-4 py-2 rounded">
              Add Service
            </button>
            <button
              onClick={() => setForm({ service_name: '', description: '', inclusions: [''], duration_value: '', duration_unit: 'minutes', may_overlap: false, has_sizes: false, base_price: '', small_price: '', medium_price: '', large_price: '', extra_large_price: '' })}
              className="bg-gray-200 px-4 py-2 rounded"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right: services list */}
        <div className="w-full lg:w-1/3 bg-white rounded shadow p-4">
          {/* Regular Package Services */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Package Services</h2>

            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : services.filter(s => !s.is_solo).length === 0 ? (
              <div className="text-sm text-gray-500">No package services added yet.</div>
            ) : (
              <div className="space-y-2">
                {services.filter(s => !s.is_solo).map((service) => (
                  <div key={service.id} className="border rounded p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{service.service_name}</h3>
                      <p className="text-xs text-gray-500">{formatDuration(service.duration_minutes)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(service)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-green-600 hover:text-green-800"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteDialog({ isOpen: true, serviceId: service.id })}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Solo Services Section */}
          <div className="mt-8 pt-6 border-t-2 border-green-300">
            <h3 className="text-lg font-semibold mb-3 text-green-700">Add-ons / Solo Services</h3>

            {services.filter(s => s.is_solo).length === 0 ? (
              <div className="text-sm text-gray-500 mb-3">No solo services added yet.</div>
            ) : (
              <div className="space-y-2 mb-4">
                {services.filter(s => s.is_solo).map((service) => (
                  <div key={service.id} className="border-2 border-green-200 rounded p-3 flex items-center justify-between bg-green-50">
                    <div className="flex-1">
                      <h3 className="font-medium text-green-900">{service.service_name}</h3>
                      <div className="text-xs text-green-700 mt-1 space-y-1">
                        {service.can_be_addon && (
                          <p>🏷️ Add-on: {formatCurrency(service.addon_price)}</p>
                        )}
                        {service.can_be_standalone && (
                          <p>🛍️ Standalone: {formatCurrency(service.standalone_price)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(service)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-green-600 hover:text-green-800"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteDialog({ isOpen: true, serviceId: service.id })}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowSoloModal(true)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <FaPlus /> Add Solo Service
            </button>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedService && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-40 pointer-events-none flex items-start justify-center pt-4">
          <div ref={modalRef} className="bg-accent-cream rounded-lg shadow-2xl w-full max-w-7xl h-fit pointer-events-auto">
            {/* Header with primary color */}
            <div className="bg-gradient-to-r from-primary-darker to-primary-dark p-5 text-accent-cream rounded-t-lg">
              <h2 className="heading-main">{selectedService.service_name}</h2>
              <p className="text-accent-peach text-xs mt-1">Service Details</p>
            </div>

            {/* Main Content - All in one row with proper alignment */}
            <div className="p-5 h-64">
              <div className="flex gap-4 h-full">
                {/* Left Section - Description with Image */}
                <div className="w-1/5 flex flex-col gap-3 h-full">
                  {/* Description Box */}
                  <div className="bg-accent-cream border-l-4 border-brand-gold p-4 rounded-lg shadow-sm flex-1 overflow-hidden">
                    <h3 className="font-semibold text-primary-dark text-xs uppercase tracking-wide mb-2">Description</h3>
                    <p className="text-primary-darker text-sm leading-relaxed line-clamp-6">{selectedService.description}</p>
                  </div>

                  {/* Cute Animal Image - Same aspect ratio as description box */}
                  <div className="bg-gradient-to-br from-brand-gold to-secondary-lighter rounded-lg shadow-sm p-3 flex-1 flex items-center justify-center overflow-hidden">
                    <img 
                      src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${selectedService.service_name}&backgroundColor=ffc162`}
                      alt="Service mascot"
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                </div>

                {/* Middle Section - Compact info boxes */}
                <div className="flex flex-col gap-3 justify-between h-full">
                  {/* Duration */}
                  <div className="bg-accent-peach border-l-4 border-brand-rust p-4 rounded-lg shadow-sm flex-1 flex flex-col justify-center min-w-max">
                    <h3 className="font-semibold text-primary-dark text-xs uppercase tracking-wide mb-2">Duration</h3>
                    <p className="text-2xl font-bold text-primary-darker">{formatDuration(selectedService.duration_minutes)}</p>
                  </div>

                  {/* Availability */}
                  <div className="bg-accent-peach border-l-4 border-secondary-lighter p-4 rounded-lg shadow-sm flex-1 flex flex-col justify-center min-w-max">
                    <h3 className="font-semibold text-primary-dark text-xs uppercase tracking-wide mb-2">Availability</h3>
                    {selectedService.may_overlap ? (
                      <div className="flex items-center gap-2">
                        <span className="bg-brand-rust text-accent-cream rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">✓</span>
                        <span className="text-primary-darker font-medium text-xs">Overlapping</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="bg-primary-dark text-accent-cream rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">✗</span>
                        <span className="text-primary-darker font-medium text-xs">Exclusive</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="bg-accent-peach border-2 border-brand-rust p-4 rounded-lg shadow-sm flex-1 flex flex-col justify-center h-full">
                  <h3 className="font-semibold text-primary-dark text-xs uppercase tracking-wide mb-3">Pricing</h3>
                  {selectedService.has_sizes ? (
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div className="bg-accent-cream p-2 rounded shadow-sm border-l-3 border-brand-mocha text-center flex flex-col justify-center">
                        <p className="text-xs text-primary-dark font-bold">Small</p>
                        <p className="text-lg font-bold text-primary-darker">₱{parseFloat(selectedService.small_price).toFixed(0)}</p>
                      </div>
                      <div className="bg-accent-cream p-2 rounded shadow-sm border-l-3 border-brand-coffee text-center flex flex-col justify-center">
                        <p className="text-xs text-primary-dark font-bold">Medium</p>
                        <p className="text-lg font-bold text-primary-darker">₱{parseFloat(selectedService.medium_price).toFixed(0)}</p>
                      </div>
                      <div className="bg-accent-cream p-2 rounded shadow-sm border-l-3 border-brand-rust text-center flex flex-col justify-center">
                        <p className="text-xs text-primary-dark font-bold">Large</p>
                        <p className="text-lg font-bold text-primary-darker">₱{parseFloat(selectedService.large_price).toFixed(0)}</p>
                      </div>
                      <div className="bg-accent-cream p-2 rounded shadow-sm border-l-3 border-primary-darker text-center flex flex-col justify-center">
                        <p className="text-xs text-primary-dark font-bold">XL</p>
                        <p className="text-lg font-bold text-primary-darker">₱{parseFloat(selectedService.extra_large_price).toFixed(0)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-accent-cream p-3 rounded border-2 border-brand-gold text-center flex-1 flex flex-col justify-center">
                      <p className="text-xs text-primary-dark font-semibold mb-1">Base Price</p>
                      <p className="price price-large text-primary-darker">{formatCurrency(selectedService.base_price)}</p>
                    </div>
                  )}
                </div>

                {/* Inclusions - Right side with proper sizing */}
                {selectedService.inclusions && selectedService.inclusions.length > 0 && (
                  <div className="bg-accent-peach border-2 border-secondary-lighter p-4 rounded-lg shadow-sm flex-1 flex flex-col justify-start h-full">
                    <h3 className="font-semibold text-primary-dark text-xs uppercase tracking-wide mb-3">✨ Included</h3>
                    <div className="grid grid-cols-2 gap-2 flex-1 overflow-hidden">
                      {selectedService.inclusions.map((inc, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-accent-cream rounded border-l-2 border-brand-rust overflow-hidden">
                          <span className="text-brand-rust flex-shrink-0 font-bold text-sm">✓</span>
                          <span className="text-primary-darker text-xs font-medium line-clamp-2">{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-accent-peach px-5 py-3 flex justify-end gap-2 border-t border-primary-dark rounded-b-lg">
              <button
                onClick={() => setShowViewModal(false)}
                className="bg-primary-dark hover:bg-primary-darker text-accent-cream px-5 py-2 rounded-lg font-semibold text-sm transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-40 pointer-events-none flex items-start justify-center pt-4">
          <div ref={modalRef} className="bg-white p-6 rounded shadow-lg w-full max-w-lg pointer-events-auto">
            <h2 className="text-lg font-semibold mb-4">Edit Service</h2>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium">Service Name</label>
                <input
                  name="service_name"
                  value={editForm.service_name || ''}
                  onChange={handleEditChange}
                  className="mt-1 w-full border rounded px-2 py-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  value={editForm.description || ''}
                  onChange={handleEditChange}
                  rows={3}
                  className="mt-1 w-full border rounded px-2 py-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Inclusions</label>
                {editForm.inclusions && editForm.inclusions.map((inclusion, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      value={inclusion}
                      onChange={(e) => handleEditInclusionChange(index, e.target.value)}
                      className="flex-1 border rounded px-2 py-1"
                    />
                    {editForm.inclusions.length > 1 && (
                      <button
                        onClick={() => removeEditInclusion(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaMinus />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addEditInclusion}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <FaPlus /> Add Inclusion
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium">Duration</label>
                <div className="flex gap-2 mt-1">
                  <input
                    name="duration_value"
                    value={editForm.duration_value || ''}
                    onChange={handleEditChange}
                    className="flex-1 border rounded px-2 py-1"
                    type="number"
                    step="1"
                    min="1"
                  />
                  <select
                    name="duration_unit"
                    value={editForm.duration_unit || 'minutes'}
                    onChange={handleEditChange}
                    className="border rounded px-2 py-1"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="may_overlap"
                    checked={editForm.may_overlap || false}
                    onChange={(e) => setEditForm(prev => ({ ...prev, may_overlap: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">May Overlap</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Allow multiple customers to book this service at the same time
                </p>
              </div>

              {/* Size-Based Pricing Section */}
              <div className="mt-6 p-4 bg-gray-50 rounded border-2 border-gray-200">
                <label className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    name="has_sizes"
                    checked={editForm.has_sizes || false}
                    onChange={(e) => setEditForm(prev => ({ ...prev, has_sizes: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Enable Size-Based Pricing</span>
                </label>

                {editForm.has_sizes ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Small Price (₱) *</label>
                      <input
                        type="number"
                        name="small_price"
                        value={editForm.small_price || ''}
                        onChange={handleEditChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Medium Price (₱) *</label>
                      <input
                        type="number"
                        name="medium_price"
                        value={editForm.medium_price || ''}
                        onChange={handleEditChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Large Price (₱) *</label>
                      <input
                        type="number"
                        name="large_price"
                        value={editForm.large_price || ''}
                        onChange={handleEditChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Extra Large Price (₱) *</label>
                      <input
                        type="number"
                        name="extra_large_price"
                        value={editForm.extra_large_price || ''}
                        onChange={handleEditChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Base Price (₱) *</label>
                    <input
                      type="number"
                      name="base_price"
                      value={editForm.base_price || ''}
                      onChange={handleEditChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => setConfirmEditDialog({ isOpen: true, service: editForm })}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />
      
      
      {/* Solo Service Modal */}
      {showSoloModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-40 pointer-events-none flex items-start justify-center pt-4">
          <div ref={modalRef} className="bg-white rounded-lg shadow-2xl w-full max-w-md pointer-events-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white rounded-t-lg">
              <h2 className="text-lg font-bold">Add Solo Service</h2>
              <p className="text-sm text-green-100 mt-1">Create a standalone service or add-on</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Name *</label>
                <input
                  type="text"
                  value={soloForm.service_name}
                  onChange={(e) => setSoloForm({ ...soloForm, service_name: e.target.value })}
                  placeholder="e.g., Nail Trimming, Teeth Cleaning"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Dynamic Price Inputs */}
              {soloForm.can_be_addon && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add-on Price (₱) *</label>
                  <input
                    type="number"
                    value={soloForm.addon_price}
                    onChange={(e) => setSoloForm({ ...soloForm, addon_price: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Price when used as add-on to package deals</p>
                </div>
              )}

              {soloForm.can_be_standalone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Standalone Price (₱) *</label>
                  <input
                    type="number"
                    value={soloForm.standalone_price}
                    onChange={(e) => setSoloForm({ ...soloForm, standalone_price: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Price when purchased independently</p>
                </div>
              )}

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Service Type *</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={soloForm.can_be_addon}
                      onChange={(e) => setSoloForm({ ...soloForm, can_be_addon: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <div>
                      <p className="font-medium text-gray-700">Can be Add-on</p>
                      <p className="text-xs text-gray-500">Include in package deals</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={soloForm.can_be_standalone}
                      onChange={(e) => setSoloForm({ ...soloForm, can_be_standalone: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <div>
                      <p className="font-medium text-gray-700">Can be Standalone</p>
                      <p className="text-xs text-gray-500">Purchase independently</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  setShowSoloModal(false);
                  setSoloForm({ service_name: '', addon_price: '', standalone_price: '', can_be_addon: true, can_be_standalone: true });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSoloServiceSubmit}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
              >
                Add Solo Service
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmEditDialog.isOpen}
        title="Save Changes"
        message="Are you sure you want to save changes?"
        onConfirm={saveEdit}
        onCancel={() => setConfirmEditDialog({ isOpen: false, service: null })}
      />
      
      <ConfirmDialog
        isOpen={confirmDeleteDialog.isOpen}
        title="Delete Service"
        message="Are you sure you want to delete this service?"
        onConfirm={() => handleDelete(confirmDeleteDialog.serviceId)}
        onCancel={() => setConfirmDeleteDialog({ isOpen: false, serviceId: null })}
      />
    </div>
  );
}
