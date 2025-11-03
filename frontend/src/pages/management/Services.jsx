import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FaEye, FaEdit, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function Services() {
  const { token } = useAuth();
  const { toast, showToast } = useToast();
  const [form, setForm] = useState({
    service_name: '',
    description: '',
    inclusions: [''],
    duration_value: '',
    duration_unit: 'minutes',
    may_overlap: false,
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

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const res = await fetch('http://127.0.0.1:8000/api/services/', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
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
      };

      const res = await fetch('http://127.0.0.1:8000/api/services/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      showToast('Service added successfully!', 'success');
      setForm({ service_name: '', description: '', inclusions: [''], duration_value: '', duration_unit: 'minutes', may_overlap: false });
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
      };

      const res = await fetch(`http://127.0.0.1:8000/api/services/${editForm.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      const res = await fetch(`http://127.0.0.1:8000/api/services/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  return (
    <div className="p-6 min-h-screen bg-accent-cream">
      <h1 className="text-2xl font-bold mb-4 text-primary-darker">Services Management</h1>

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
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={handleAddService} className="bg-blue-600 text-white px-4 py-2 rounded">
              Add Service
            </button>
            <button
              onClick={() => setForm({ service_name: '', description: '', inclusions: [''], duration_value: '', duration_unit: 'minutes', may_overlap: false })}
              className="bg-gray-200 px-4 py-2 rounded"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right: services list */}
        <div className="w-full lg:w-1/3 bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Services List</h2>

          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : services.length === 0 ? (
            <div className="text-sm text-gray-500">No services added yet.</div>
          ) : (
            <div className="space-y-2">
              {services.map((service) => (
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
      </div>

      {/* View Modal */}
      {showViewModal && selectedService && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">{selectedService.service_name}</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-sm text-gray-600">Description</h3>
                <p className="text-sm">{selectedService.description}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-600">Inclusions</h3>
                <ul className="list-disc list-inside text-sm">
                  {selectedService.inclusions.map((inc, idx) => (
                    <li key={idx}>{inc}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-600">Duration</h3>
                <p className="text-sm">{formatDuration(selectedService.duration_minutes)}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-600">May Overlap</h3>
                <p className="text-sm">
                  {selectedService.may_overlap ? (
                    <span className="text-green-600 font-medium">✓ Yes - Multiple customers can book at the same time</span>
                  ) : (
                    <span className="text-gray-600">✗ No - Exclusive time slot</span>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
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
