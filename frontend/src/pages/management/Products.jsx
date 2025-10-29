import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function Products(){
  const initialForm = {
    name: '',
    category: '',
    description: '',
    supplier: '',
    unitCost: '',
    quantity: '',
    reorderLevel: '',
    reorderQuantity: '',
    branch: 'Matina'
  };

  const [form, setForm] = useState(initialForm);
  const [tempList, setTempList] = useState([]);
  const [errors, setErrors] = useState({});
  const { token } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.category.trim()) e.category = 'Category is required';
    if (!form.unitCost || isNaN(Number(form.unitCost))) e.unitCost = 'Unit cost must be a number';
    if (!form.quantity || isNaN(Number(form.quantity))) e.quantity = 'Quantity must be a number';
    if (!form.reorderLevel || isNaN(Number(form.reorderLevel))) e.reorderLevel = 'Reorder level must be a number';
    if (!form.reorderQuantity || isNaN(Number(form.reorderQuantity))) e.reorderQuantity = 'Reorder quantity must be a number';
    if (!form.branch) e.branch = 'Branch is required';
    return e;
  }

  function handleChange(e){
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleAddToList(){
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const item = {
      tempId: Date.now() + Math.random(),
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      supplier: form.supplier.trim(),
      unitCost: Number(form.unitCost),
      quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel),
      reorderQuantity: Number(form.reorderQuantity),
      branch: form.branch
    };

    setTempList(prev => [item, ...prev]);
    setForm(initialForm);
    setErrors({});
  }

  function removeFromTemp(tempId){
    setTempList(prev => prev.filter(i => i.tempId !== tempId));
  }

  function handleConfirm(){
    if (tempList.length === 0) return;
    setShowConfirm(true);
  }

  async function confirmNow(){
    setLoadingConfirm(true);
    try {
      const payload = tempList.map(it => ({
        name: it.name,
        category: it.category,
        description: it.description,
        supplier: it.supplier,
        unit_cost: it.unitCost,
        quantity: it.quantity,
        reorder_level: it.reorderLevel,
        reorder_quantity: it.reorderQuantity,
        branch: it.branch,
      }));

      const res = await fetch('http://127.0.0.1:8000/api/inventory/products/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Failed to save products');
      }

      // success: clear temp list and close modal
      setTempList([]);
      setShowConfirm(false);
      alert('Products saved to inventory. View them on the Inventory page.');
    } catch (err) {
      console.error(err);
      alert('Failed to save products. Check console for details.');
    } finally {
      setLoadingConfirm(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Products Management</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: input form */}
        <div className="flex-1 bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Add Product</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Branch</label>
              <select name="branch" value={form.branch} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1">
                <option value="Matina">Matina</option>
                <option value="Toril">Toril</option>
              </select>
              {errors.branch && <div className="text-red-600 text-sm">{errors.branch}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Product Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" />
              {errors.name && <div className="text-red-600 text-sm">{errors.name}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1">
                <option value="">-- Select category --</option>
                <option value="Pet Food & Treats">Pet Food & Treats</option>
                <option value="Grooming & Hygiene">Grooming & Hygiene</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Accessories & Toys">Accessories & Toys</option>
                <option value="Cages & Bedding">Cages & Bedding</option>
                <option value="Feeding Supplies">Feeding Supplies</option>
                <option value="Cleaning Supplies">Cleaning Supplies</option>
              </select>
              {errors.category && <div className="text-red-600 text-sm">{errors.category}</div>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="mt-1 w-full border rounded px-2 py-1" />
            </div>

            <div>
              <label className="block text-sm font-medium">Supplier</label>
              <input name="supplier" value={form.supplier} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" />
            </div>

            <div>
              <label className="block text-sm font-medium">Unit Cost (₱)</label>
              <input name="unitCost" value={form.unitCost} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" />
              {errors.unitCost && <div className="text-red-600 text-sm">{errors.unitCost}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium">Quantity in Stock</label>
              <input name="quantity" value={form.quantity} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" />
              {errors.quantity && <div className="text-red-600 text-sm">{errors.quantity}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium">Reorder Level</label>
              <input name="reorderLevel" value={form.reorderLevel} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" />
              {errors.reorderLevel && <div className="text-red-600 text-sm">{errors.reorderLevel}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium">Reorder Quantity</label>
              <input name="reorderQuantity" value={form.reorderQuantity} onChange={handleChange} className="mt-1 w-full border rounded px-2 py-1" />
              {errors.reorderQuantity && <div className="text-red-600 text-sm">{errors.reorderQuantity}</div>}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={handleAddToList} className="bg-blue-600 text-white px-4 py-2 rounded">Add to list</button>
            <button onClick={() => setForm(initialForm)} className="bg-gray-200 px-4 py-2 rounded">Reset</button>
          </div>
        </div>

        {/* Right: temporary list */}
        <div className="w-full lg:w-1/3 bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Products to Confirm</h2>

          {tempList.length === 0 ? (
            <div className="text-sm text-gray-500">No products in the list. Use the form to add products.</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-auto">
              {tempList.map(item => (
                <div key={item.tempId} className="border rounded p-2 flex justify-between items-start">
                  <div className="pr-2">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">{item.category} • {item.supplier}</div>
                    <div className="text-sm text-gray-500">Qty: {item.quantity} • ₱{item.unitCost}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => removeFromTemp(item.tempId)} className="text-red-600 text-sm">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <button onClick={handleConfirm} className="w-full bg-green-600 text-white px-4 py-2 rounded">Confirm Products</button>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded p-4 w-11/12 max-w-lg">
            <h3 className="text-lg font-semibold">Confirm products</h3>
            <p className="text-sm text-gray-700 mt-2">You are about to add {tempList.length} products to inventory. This will persist them to the backend.</p>
            <div className="mt-3 max-h-48 overflow-auto border rounded p-2 bg-gray-50">
              {tempList.map(i => (
                <div key={i.tempId} className="text-sm py-1 border-b last:border-b-0">
                  <strong>{i.name}</strong> — {i.category} — Qty: {i.quantity}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1 rounded border" onClick={() => setShowConfirm(false)} disabled={loadingConfirm}>Cancel</button>
              <button className="px-4 py-1 rounded bg-green-600 text-white" onClick={confirmNow} disabled={loadingConfirm}>{loadingConfirm ? 'Saving...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

