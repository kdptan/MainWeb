import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FaTrash, FaPencilAlt, FaBox, FaHistory } from 'react-icons/fa';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import RestockingModal from '../../components/RestockingModal';
import ProductHistoryModal from '../../components/ProductHistoryModal';

// eslint-disable-next-line no-unused-vars
const categories = [
  'Pet Food & Treats',
  'Grooming & Hygiene',
  'Health & Wellness',
  'Accessories & Toys',
  'Cages & Bedding',
  'Feeding Supplies',
  'Cleaning Supplies',
];

export default function Inventory(){
  const { token } = useAuth();
  const { toast, showToast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  // default sort: by id ascending (least number on top)
  const [sortBy, setSortBy] = useState({ field: 'id', dir: 'asc' });
  const [branch, setBranch] = useState('Matina');
  const [activeTab, setActiveTab] = useState('inventory');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);

  const [editReason, setEditReason] = useState('');

  const [selectedField, setSelectedField] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [newValue, setNewValue] = useState('');

  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({ isOpen: false, productId: null });

  const fetchInventory = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let url = 'http://127.0.0.1:8000/api/inventory/products/';
      if (branch) url += `?branch=${encodeURIComponent(branch)}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // normalize field names from backend if needed
      const normalized = data.map(d => {
        const qty = Number(d.quantity || 0);
        const rlevel = Number(d.reorder_level ?? d.reorderLevel ?? 0);
        // Always calculate remarks based on current quantity and reorder level
        let remarks;
        if (qty === 0) remarks = 'Out of Stock';
        else if (qty <= rlevel) remarks = 'Reorder soon';
        else remarks = 'In Stock';
        return {
          id: d.id,
          formattedId: d.formatted_id || null,
          name: d.name,
          category: d.category,
          description: d.description,
          supplier: d.supplier,
          unitCost: Number(d.unit_cost || d.unitCost || 0),
          retailPrice: Number(d.retail_price || 0),
          quantity: qty,
          reorderLevel: rlevel,
          reorderQuantity: Number(d.reorder_quantity || d.reorderQuantity || 0),
          branch: d.branch || 'Matina',
          itemNumber: d.item_number ?? null,
          remarks,
        };
      });
      setInventory(normalized);
    } catch (err) {
      console.error(err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [token, branch]);

  useEffect(() => { 
    fetchInventory(); 
  }, [fetchInventory]);

  const displayedRows = useMemo(() => {
    let rows = [...inventory];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r => (r.name || '').toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q) || (r.supplier || '').toLowerCase().includes(q));
    }
    const f = sortBy.field;
    rows.sort((a,b) => {
      const av = a[f] ?? '';
      const bv = b[f] ?? '';
      // If sorting by id or numeric field, compare numerically
      if ((f === 'id' || typeof av === 'number') && typeof bv === 'number') return sortBy.dir === 'asc' ? av - bv : bv - av;
      return sortBy.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return rows;
  }, [inventory, search, sortBy]);

  const formatItemId = (num, branchVal = 'Matina', categoryVal = 'Pet Food & Treats') => {
    if (num === null || num === undefined) return '';
    const branchCode = branchVal === 'Matina' ? 'M' : 'T';
    const catMap = {
      'Pet Food & Treats': 'A',
      'Grooming & Hygiene': 'B',
      'Health & Wellness': 'C',
      'Accessories & Toys': 'D',
      'Cages & Bedding': 'E',
      'Feeding Supplies': 'F',
      'Cleaning Supplies': 'G',
    };
    const catCode = catMap[categoryVal] || 'X';
    return `${branchCode}-${catCode}-${String(num).padStart(3, '0')}`;
  };

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/inventory/products/${id}/`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(await res.text());
      showToast('Product deleted successfully.', 'success');
      fetchInventory();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete product.', 'error');
    } finally {
      setConfirmDeleteDialog({ isOpen: false, productId: null });
    }
  };

  const openEditModal = (item) => {
    setEditForm(item);
    setShowEditModal(true);
  };

  // eslint-disable-next-line no-unused-vars
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFieldChange = (field) => {
    setSelectedField(field);
    switch (field) {
      case 'Unit Cost (₱)':
        setCurrentValue(editForm.unitCost);
        break;
      case 'Quantity in Stock':
        setCurrentValue(editForm.quantity);
        break;
      case 'Reorder Level':
        setCurrentValue(editForm.reorderLevel);
        break;
      case 'Reorder Quantity':
        setCurrentValue(editForm.reorderQuantity);
        break;
      default:
        setCurrentValue('');
    }
  };

  const saveEdit = async () => {
    if (!token) {
      showToast('Your session has expired. Please log in again.', 'error');
      return;
    }

    if (!selectedField || !newValue.trim()) {
      showToast('Please select a field and provide a new value.', 'error');
      return;
    }

    try {
      // Get the field name for the backend
      let fieldName;
      let fieldValue;
      
      switch (selectedField) {
        case 'Unit Cost (₱)':
          fieldName = 'unit_cost';
          fieldValue = parseFloat(newValue);
          break;
        case 'Quantity in Stock':
          fieldName = 'quantity';
          fieldValue = parseInt(newValue);
          break;
        case 'Reorder Level':
          fieldName = 'reorder_level';
          fieldValue = parseInt(newValue);
          break;
        case 'Reorder Quantity':
          fieldName = 'reorder_quantity';
          fieldValue = parseInt(newValue);
          break;
        default:
          throw new Error('Invalid field selected');
      }

      // Include only the field being changed (partial update)
      const payload = {
        [fieldName]: fieldValue,
      };

      console.log('Payload being sent:', payload); // Debugging log

      const res = await fetch(`http://127.0.0.1:8000/api/inventory/products/${editForm.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response from server:', errorText); // Debugging log
        if (res.status === 401) {
          showToast('Unauthorized. Please log in again.', 'error');
          return;
        }
        throw new Error(errorText);
      }

      // Save audit log entry
      try {
        await fetch('http://127.0.0.1:8000/api/inventory/audit-logs/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            item_id: editForm.formattedId || editForm.id,
            field_changed: selectedField,
            old_value: currentValue,
            new_value: fieldValue,
            remarks: editReason || 'No reason provided'
          }),
        });
      } catch (logErr) {
        console.error('Failed to save audit log:', logErr);
      }

      showToast('Product updated successfully!', 'success');
      fetchInventory();
      setShowEditModal(false);
      setSelectedField('');
      setNewValue('');
      setEditReason('');
    } catch (err) {
      console.error('Failed to update product:', err); // Debugging log
      showToast(`Failed to update product: ${err.message}`, 'error');
    }
  };

  const confirmEdit = () => {
    setShowConfirmEdit(true);
  };

  const handleConfirmEdit = () => {
    setShowConfirmEdit(false);
    saveEdit();
  };

  return (
    <div className="p-6 min-h-screen bg-accent-cream">
      <div className="mb-6">
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b-2 border-primary">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'inventory'
              ? 'border-b-4 border-primary text-primary-darker bg-white'
              : 'text-gray-600 hover:text-primary-darker'
          }`}
        >
          Inventory
        </button>
        <button
          onClick={() => setActiveTab('stock-flow')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'stock-flow'
              ? 'border-b-4 border-primary text-primary-darker bg-white'
              : 'text-gray-600 hover:text-primary-darker'
          }`}
        >
          <FaBox className="inline mr-2" />Stock Flow
        </button>
        <button
          onClick={() => setActiveTab('product-history')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'product-history'
              ? 'border-b-4 border-primary text-primary-darker bg-white'
              : 'text-gray-600 hover:text-primary-darker'
          }`}
        >
          <FaHistory className="inline mr-2" />Product History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'inventory' && (
      <div className="mt-4 bg-white rounded shadow p-4 border-2 border-primary">
        <div className="flex items-center gap-3 mb-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, category, supplier" className="border border-primary rounded px-2 py-1 w-64 text-primary-darker" />
          <div className="flex items-center gap-2">
            <label className="text-sm text-primary-darker font-medium">Branch</label>
            <select value={branch} onChange={e => setBranch(e.target.value)} className="border border-primary rounded px-2 py-1 text-primary-darker">
              <option value="Matina">Matina</option>
              <option value="Toril">Toril</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-primary-darker font-medium">Sort by</label>
            <select value={sortBy.field} onChange={e => setSortBy(prev => ({ ...prev, field: e.target.value }))} className="border border-primary rounded px-2 py-1 text-primary-darker">
              <option value="id">Item ID</option>
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="quantity">Quantity</option>
            </select>
            <button onClick={() => setSortBy(prev => ({ ...prev, dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="border border-primary px-2 py-1 rounded text-primary-darker hover:bg-accent-peach">{sortBy.dir === 'asc' ? '↑' : '↓'}</button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-primary-dark">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-600">Error: {error}</div>
        ) : displayedRows.length === 0 ? (
          <div className="text-sm text-primary-dark">Inventory is empty.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm text-primary-darker">
              <thead>
                <tr className="text-left border-b border-primary">
                  <th className="p-2">Item ID</th>
                  <th className="p-2">Product Name</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Supplier</th>
                  <th className="p-2">Unit Cost (₱)</th>
                  <th className="p-2">Retail Price (₱)</th>
                  <th className="p-2">Quantity in Stock</th>
                  <th className="p-2">Reorder Level</th>
                  <th className="p-2">Reorder Quantity</th>
                  <th className="p-2">Remarks</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 h-12">
                    <td className="px-2 py-1 align-middle whitespace-nowrap">{item.formattedId || formatItemId(item.itemNumber ?? item.id, item.branch, item.category)}</td>
                    <td className="px-2 py-1 align-middle">{item.name}</td>
                    <td className="px-2 py-1 align-middle">{item.category}</td>
                    <td className="px-2 py-1 align-middle">{item.description}</td>
                    <td className="px-2 py-1 align-middle">{item.supplier}</td>
                    <td className="px-2 py-1 align-middle">₱{Number(item.unitCost).toFixed(2)}</td>
                    <td className="px-2 py-1 align-middle font-semibold text-blue-600">₱{Number(item.retailPrice).toFixed(2)}</td>
                    <td className="px-2 py-1 align-middle">{item.quantity}</td>
                    <td className="px-2 py-1 align-middle">{item.reorderLevel}</td>
                    <td className="px-2 py-1 align-middle">{item.reorderQuantity}</td>
                    <td className="px-2 py-1 align-middle whitespace-nowrap pr-6">
                      {item.remarks === 'In Stock' && (
                        <span className="inline-block px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded">In Stock</span>
                      )}
                      {item.remarks === 'Reorder soon' && (
                        <span className="inline-block px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">Reorder soon</span>
                      )}
                      {item.remarks === 'Out of Stock' && (
                        <span className="inline-block px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded">Out of Stock</span>
                      )}
                      {!['In Stock','Reorder soon','Out of Stock'].includes(item.remarks) && (
                        <span className="inline-block px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded">{item.remarks}</span>
                      )}
                    </td>
                    <td className="px-2 py-1 align-middle text-center pl-6 flex justify-center gap-2">
                      <button onClick={() => openEditModal(item)} className="text-blue-600 hover:text-blue-800">
                        <FaPencilAlt />
                      </button>
                      <button onClick={() => setConfirmDeleteDialog({ isOpen: true, productId: item.id })} className="text-red-600 hover:text-red-800">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Stock Flow Tab */}
      {activeTab === 'stock-flow' && (
        <div className="bg-white rounded shadow p-4 border-2 border-primary max-h-[80vh] overflow-y-auto">
          <RestockingModal
            isOpen={true}
            onClose={() => setActiveTab('inventory')}
            products={displayedRows}
            onRestockSuccess={(message) => {
              showToast(message, 'success');
              setActiveTab('inventory');
              fetchInventory();
            }}
            token={token}
            embedded={true}
          />
        </div>
      )}

      {/* Product History Tab */}
      {activeTab === 'product-history' && (
        <div className="bg-white rounded shadow p-4 border-2 border-primary">
          <ProductHistoryModal
            isOpen={true}
            onClose={() => setActiveTab('inventory')}
            token={token}
            embedded={true}
          />
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Edit Product</h2>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium">Field to Edit</label>
                <select value={selectedField} onChange={e => handleFieldChange(e.target.value)} className="mt-1 w-full border rounded px-2 py-1">
                  <option value="">-- Select field --</option>
                  <option value="Unit Cost (₱)">Unit Cost (₱)</option>
                  <option value="Quantity in Stock">Quantity in Stock</option>
                  <option value="Reorder Level">Reorder Level</option>
                  <option value="Reorder Quantity">Reorder Quantity</option>
                </select>
              </div>
              {selectedField && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Current {selectedField}: {currentValue}</p>
                  <label className="block text-sm font-medium mt-2">New Value</label>
                  <input
                    type="text"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    className="mt-1 w-full border rounded px-2 py-1"
                    placeholder={`Enter new ${selectedField}`}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium">Reason for Edit</label>
                <textarea value={editReason} onChange={(e) => setEditReason(e.target.value)} rows={3} className="mt-1 w-full border rounded px-2 py-1" placeholder="Provide a reason for the edit" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
              <button onClick={confirmEdit} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmEdit && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Confirmation</h2>
            <p>Are you sure you want to edit this record?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowConfirmEdit(false)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleConfirmEdit} className="bg-blue-600 text-white px-4 py-2 rounded">Yes, Edit</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />
      
      <ConfirmDialog
        isOpen={confirmDeleteDialog.isOpen}
        title="Delete Product"
        message="Are you sure you want to delete this product?"
        onConfirm={() => deleteProduct(confirmDeleteDialog.productId)}
        onCancel={() => setConfirmDeleteDialog({ isOpen: false, productId: null })}
      />
    </div>
  );
}
