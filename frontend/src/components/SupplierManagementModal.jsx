import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const SupplierManagementModal = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const scrollContainerRef = React.useRef(null);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  });

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://127.0.0.1:8000/api/inventory/suppliers/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSuppliers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch suppliers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Disable body scroll when modal is open
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

  // Fetch suppliers on mount
  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen, fetchSuppliers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: ''
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingId) {
        // Update existing supplier
        await axios.put(`http://127.0.0.1:8000/api/inventory/suppliers/${editingId}/`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // Create new supplier
        await axios.post('http://127.0.0.1:8000/api/inventory/suppliers/', formData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      fetchSuppliers();
      resetForm();
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save supplier');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier) => {
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || ''
    });
    setEditingId(supplier.id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        setLoading(true);
        await axios.delete(`http://127.0.0.1:8000/api/inventory/suppliers/${id}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchSuppliers();
        setError('');
      } catch (err) {
        setError('Failed to delete supplier');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-secondary to-orange-600 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Supplier Management</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-orange-700 p-2 rounded-lg transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Add Supplier Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-6 bg-primary-darker hover:bg-black text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <FaPlus /> Add New Supplier
            </button>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                {editingId ? 'Edit Supplier' : 'New Supplier'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., ABC Supplies Inc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    placeholder="e.g., John Smith"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="supplier@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g., +1-555-0123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., New York"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-secondary hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Supplier' : 'Add Supplier'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Search Bar */}
          {!showForm && suppliers.length > 0 && (
            <div className="mb-6 relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers by name, contact, email, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>
          )}

          {/* Suppliers List */}
          {!showForm && (
            <>
              {loading && !suppliers.length ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading suppliers...</p>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {suppliers.length === 0
                      ? 'No suppliers yet. Add your first supplier!'
                      : 'No suppliers match your search.'}
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Scroll Left Button */}
                  <button
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
                      }
                    }}
                    className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-gray-100 p-3 rounded-full transition"
                  >
                    <FaChevronLeft className="text-gray-700" size={20} />
                  </button>

                  {/* Scroll Right Button */}
                  <button
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
                      }
                    }}
                    className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-gray-100 p-3 rounded-full transition"
                  >
                    <FaChevronRight className="text-gray-700" size={20} />
                  </button>

                  {/* Supplier Cards Container */}
                  <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-4 scroll-smooth px-4">
                    {filteredSuppliers.map(supplier => (
                <div
                  key={supplier.id}
                  className="flex-shrink-0 w-80 p-4 border border-gray-200 rounded-lg hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-lg">
                        {supplier.name}
                      </h4>
                      {supplier.contact_person && (
                        <p className="text-sm text-gray-600">
                          Contact: {supplier.contact_person}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition"
                        title="Edit supplier"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition"
                        title="Delete supplier"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    {supplier.email && (
                      <p>
                        <span className="font-medium">Email:</span> {supplier.email}
                      </p>
                    )}
                    {supplier.phone && (
                      <p>
                        <span className="font-medium">Phone:</span> {supplier.phone}
                      </p>
                    )}
                    {supplier.city && (
                      <p>
                        <span className="font-medium">City:</span> {supplier.city}
                      </p>
                    )}
                    {supplier.address && (
                      <p>
                        <span className="font-medium">Address:</span> {supplier.address}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierManagementModal;
