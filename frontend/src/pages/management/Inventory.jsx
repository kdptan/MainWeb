import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function Inventory(){
  const { token } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  // default sort: by id ascending (least number on top)
  const [sortBy, setSortBy] = useState({ field: 'id', dir: 'asc' });
  const [branch, setBranch] = useState('Matina');

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
        let remarks = (d.remarks || '').trim();
        if (!remarks) {
          if (qty === 0) remarks = 'Out of Stock';
          else if (qty <= rlevel) remarks = 'Reorder soon';
          else remarks = 'In Stock';
        }
        return {
          id: d.id,
          formattedId: d.formatted_id || null,
          name: d.name,
          category: d.category,
          description: d.description,
          supplier: d.supplier,
          unitCost: Number(d.unit_cost || d.unitCost || 0),
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

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory — {branch}</h1>
        <div className="flex items-center gap-2">
          <button onClick={fetchInventory} className="px-3 py-1 border rounded">Refresh</button>
        </div>
      </div>

      <div className="mt-4 bg-white rounded shadow p-4">
        <div className="flex items-center gap-3 mb-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, category, supplier" className="border rounded px-2 py-1 w-64" />
          <div className="flex items-center gap-2">
            <label className="text-sm">Branch</label>
            <select value={branch} onChange={e => setBranch(e.target.value)} className="border rounded px-2 py-1">
              <option value="Matina">Matina</option>
              <option value="Toril">Toril</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Sort by</label>
            <select value={sortBy.field} onChange={e => setSortBy(prev => ({ ...prev, field: e.target.value }))} className="border rounded px-2 py-1">
              <option value="id">Item ID</option>
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="quantity">Quantity</option>
            </select>
            <button onClick={() => setSortBy(prev => ({ ...prev, dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="border px-2 py-1 rounded">{sortBy.dir === 'asc' ? '↑' : '↓'}</button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-600">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-600">Error: {error}</div>
        ) : displayedRows.length === 0 ? (
          <div className="text-sm text-gray-500">Inventory is empty.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Item ID</th>
                  <th className="p-2">Product Name</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Supplier</th>
                  <th className="p-2">Unit Cost (₱)</th>
                  <th className="p-2">Quantity in Stock</th>
                  <th className="p-2">Reorder Level</th>
                  <th className="p-2">Reorder Quantity</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2 align-top">{item.formattedId || formatItemId(item.itemNumber ?? item.id, item.branch, item.category)}</td>
                    <td className="p-2 align-top">{item.name}</td>
                    <td className="p-2 align-top">{item.category}</td>
                    <td className="p-2 align-top">{item.description}</td>
                    <td className="p-2 align-top">{item.supplier}</td>
                    <td className="p-2 align-top">₱{Number(item.unitCost).toFixed(2)}</td>
                    <td className="p-2 align-top">{item.quantity}</td>
                    <td className="p-2 align-top">{item.reorderLevel}</td>
                    <td className="p-2 align-top">{item.reorderQuantity}</td>
                    <td className="p-2 align-top">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
