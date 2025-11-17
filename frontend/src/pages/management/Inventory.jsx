import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FaBox, FaHistory, FaTimes, FaReceipt } from 'react-icons/fa';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import ProductHistoryModal from '../../components/ProductHistoryModal';
import RestockReceiptModal from '../../components/RestockReceiptModal';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import axios from 'axios';

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
  
  // Supplier management states
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [supplierSortBy, setSupplierSortBy] = useState({ field: 'id', dir: 'asc' });
  const [stockFlowSubTab, setStockFlowSubTab] = useState('suppliers'); // 'suppliers' or 'transactions'
  const [showManageStockModal, setShowManageStockModal] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockData, setRestockData] = useState({});
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [transactionDateFilter, setTransactionDateFilter] = useState('');
  const [restockPage, setRestockPage] = useState(1);
  const productsPerPage = 2;
  const [transactionSupplierFilter, setTransactionSupplierFilter] = useState('');
  const [transactionPage, setTransactionPage] = useState(1);
  const transactionsPerPage = 5;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  // Disable body scroll when manage stock modal is open
  useEffect(() => {
    if (showManageStockModal || showRestockModal || showReceiptModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showManageStockModal, showRestockModal, showReceiptModal]);

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

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    setLoadingSuppliers(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/inventory/suppliers/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuppliers(res.data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      showToast('Failed to load suppliers', 'error');
    } finally {
      setLoadingSuppliers(false);
    }
  }, [token, showToast]);

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/inventory/history/', {
        headers: { Authorization: `Bearer ${token}` },
        params: { transaction_type: 'restock', branch }
      });
      console.log('Fetched transactions:', res.data);
      setTransactions(res.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoadingTransactions(false);
    }
  }, [token, branch, showToast]);

  useEffect(() => {
    if (activeTab === 'stock-flow') {
      fetchSuppliers();
      setSelectedSuppliers([]); // Clear selection when switching to stock-flow tab
      setStockFlowSubTab('suppliers'); // Reset to suppliers subtab
    }
  }, [activeTab, fetchSuppliers]);

  // Fetch transactions when switching to transactions subtab
  useEffect(() => {
    if (activeTab === 'stock-flow' && stockFlowSubTab === 'transactions') {
      fetchTransactions();
    }
  }, [stockFlowSubTab, activeTab, fetchTransactions]);

  const handleSupplierCheckbox = (supplierId) => {
    setSelectedSuppliers(prev => {
      if (prev.includes(supplierId)) {
        return [];
      } else {
        return [supplierId];
      }
    });
  };

  const handleManageStock = async () => {
    if (selectedSuppliers.length === 0) {
      showToast('Please select at least one supplier', 'error');
      return;
    }
    
    const selectedSupplierId = selectedSuppliers[0];
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    
    if (!supplier) {
      showToast('Supplier not found', 'error');
      return;
    }

    setLoadingProducts(true);
    setShowManageStockModal(true);
    
    try {
      // Fetch products for the selected supplier
      const res = await axios.get('http://127.0.0.1:8000/api/inventory/products/', {
        headers: { Authorization: `Bearer ${token}` },
        params: { branch }
      });
      
      // Filter products by supplier name
      const filteredProducts = res.data.filter(product => 
        product.supplier === supplier.name
      );
      
      setSupplierProducts(filteredProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      showToast('Failed to load products', 'error');
      setShowManageStockModal(false);
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredAndSortedSuppliers = useMemo(() => {
    let filtered = suppliers.filter(supplier => {
      if (!supplierSearch.trim()) return true;
      const search = supplierSearch.toLowerCase();
      return (
        (supplier.name || '').toLowerCase().includes(search) ||
        (supplier.contact_person || '').toLowerCase().includes(search) ||
        (supplier.email || '').toLowerCase().includes(search) ||
        (supplier.city || '').toLowerCase().includes(search)
      );
    });

    const field = supplierSortBy.field;
    filtered.sort((a, b) => {
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      if (field === 'id' || typeof av === 'number') {
        return supplierSortBy.dir === 'asc' ? av - bv : bv - av;
      }
      return supplierSortBy.dir === 'asc' 
        ? String(av).localeCompare(String(bv)) 
        : String(bv).localeCompare(String(av));
    });

    return filtered;
  }, [suppliers, supplierSearch, supplierSortBy]);

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

  // Group transactions by supplier and batch (same timestamp within 1 minute)
  const groupedTransactions = useMemo(() => {
    if (!transactions.length) return [];

    // Apply filters first
    let filtered = [...transactions];
    
    // Date filter (by month)
    if (transactionDateFilter) {
      filtered = filtered.filter(txn => {
        const txnDate = new Date(txn.timestamp);
        const txnYearMonth = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`;
        return txnYearMonth === transactionDateFilter;
      });
    }
    
    // Supplier filter
    if (transactionSupplierFilter) {
      filtered = filtered.filter(txn => 
        txn.supplier?.toLowerCase().includes(transactionSupplierFilter.toLowerCase())
      );
    }

    // Sort by timestamp descending (newest first)
    const sorted = filtered.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    const groups = [];
    const processedIds = new Set();

    sorted.forEach(txn => {
      if (processedIds.has(txn.id)) return;

      const supplier = txn.supplier || 'Unknown Supplier';
      const txnTime = new Date(txn.timestamp);
      
      // Find all transactions with same supplier within 1 minute
      const relatedTxns = sorted.filter(t => {
        if (processedIds.has(t.id)) return false;
        const timeDiff = Math.abs(new Date(t.timestamp) - txnTime);
        return t.supplier === txn.supplier && timeDiff < 60000; // 1 minute window
      });

      relatedTxns.forEach(t => processedIds.add(t.id));

      groups.push({
        supplier,
        timestamp: txnTime,
        user: txn.user_name || txn.user || '-',
        products: relatedTxns.map(t => ({
          name: t.product_name || t.product,
          quantity_change: t.quantity_change,
          old_quantity: t.old_quantity,
          new_quantity: t.new_quantity,
          unit_cost: t.unit_cost,
          total_cost: t.total_cost,
          reason: t.reason
        })),
        totalCost: relatedTxns.reduce((sum, t) => sum + (Number(t.total_cost) || 0), 0),
        amountPaid: relatedTxns[0]?.amount_paid, // Use first transaction's amount_paid
        transactionIds: relatedTxns.map(t => t.id) // Include all transaction IDs
      });
    });

    return groups;
  }, [transactions, transactionDateFilter, transactionSupplierFilter]);

  // Paginate grouped transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (transactionPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    return groupedTransactions.slice(startIndex, endIndex);
  }, [groupedTransactions, transactionPage]);

  const totalTransactionPages = Math.ceil(groupedTransactions.length / transactionsPerPage);

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
    <div className="p-6 min-h-screen bg-accent-cream">
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
      <div className="mt-4 bg-white rounded shadow p-4 border-2 border-primary mx-auto max-w-[1400px]">
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
            <table className="min-w-full text-xs text-primary-darker">
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
                    <td className="px-2 py-1 align-middle">{formatCurrency(item.unitCost)}</td>
                    <td className="px-2 py-1 align-middle font-semibold text-blue-600">{formatCurrency(item.retailPrice)}</td>
                    <td className="px-2 py-1 align-middle">{item.quantity}</td>
                    <td className="px-2 py-1 align-middle">{item.reorderLevel}</td>
                    <td className="px-2 py-1 align-middle">{item.reorderQuantity}</td>
                    <td className="px-2 py-1 align-middle whitespace-nowrap">
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
      )}

      {/* Stock Flow Tab - Display Suppliers */}
      {activeTab === 'stock-flow' && (
        <div className="bg-white rounded shadow p-6 border-2 border-primary mx-auto max-w-[1400px]">
          {/* Suppliers Sub-Tab */}
          {stockFlowSubTab === 'suppliers' && (
            <>
              {/* Search Bar and Controls */}
              <div className="mb-6 flex gap-4 items-center">
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
                <select
                  value={`${supplierSortBy.field}-${supplierSortBy.dir}`}
                  onChange={(e) => {
                    const [field, dir] = e.target.value.split('-');
                    setSupplierSortBy({ field, dir });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  <option value="id-asc">Sort by ID (Ascending)</option>
                  <option value="id-desc">Sort by ID (Descending)</option>
                  <option value="name-asc">Sort by Name (A-Z)</option>
                  <option value="name-desc">Sort by Name (Z-A)</option>
                  <option value="city-asc">Sort by City (A-Z)</option>
                  <option value="city-desc">Sort by City (Z-A)</option>
                </select>
                <button
                  onClick={() => setStockFlowSubTab('transactions')}
                  className="ml-auto bg-secondary hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  Transactions
                </button>
              </div>          {/* Suppliers Table */}
          {loadingSuppliers ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading suppliers...</p>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No suppliers available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="border border-gray-300 px-4 py-2 text-center text-xs w-16">Select</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs">ID</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs">Supplier Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs">Contact Person</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs">Email</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs">Phone</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs">City</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-xs">Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedSuppliers.map((supplier, idx) => (
                      <tr key={supplier.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedSuppliers.includes(supplier.id)}
                            onChange={() => handleSupplierCheckbox(supplier.id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-xs">SUP-{String(supplier.id).padStart(4, '0')}</td>
                        <td className="border border-gray-300 px-4 py-2 text-xs font-semibold">{supplier.name}</td>
                        <td className="border border-gray-300 px-4 py-2 text-xs">{supplier.contact_person || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2 text-xs">{supplier.email || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2 text-xs">{supplier.phone || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2 text-xs">{supplier.city || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2 text-xs">{supplier.address || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Manage Stock Button */}
          {!loadingSuppliers && suppliers.length > 0 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleManageStock}
                disabled={selectedSuppliers.length === 0}
                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Manage Stock
              </button>
            </div>
          )}
            </>
          )}

          {/* Transactions Sub-Tab */}
          {stockFlowSubTab === 'transactions' && (
            <>
              <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Month</label>
                    <input
                      type="month"
                      value={transactionDateFilter}
                      onChange={(e) => {
                        setTransactionDateFilter(e.target.value);
                        setTransactionPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Supplier</label>
                    <input
                      type="text"
                      value={transactionSupplierFilter}
                      onChange={(e) => {
                        setTransactionSupplierFilter(e.target.value);
                        setTransactionPage(1);
                      }}
                      placeholder="Search supplier..."
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary w-48"
                    />
                  </div>
                  {(transactionDateFilter || transactionSupplierFilter) && (
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setTransactionDateFilter('');
                          setTransactionSupplierFilter('');
                          setTransactionPage(1);
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Back to Suppliers Button */}
                <button
                  onClick={() => setStockFlowSubTab('suppliers')}
                  className="bg-secondary hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  Suppliers
                </button>
              </div>

              {loadingTransactions ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No restock transactions found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="border border-gray-300 px-4 py-2 text-left text-xs">Date & Time</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-xs">Supplier</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-xs">Products</th>
                        <th className="border border-gray-300 px-4 py-2 text-right text-xs">Total Cost</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-xs">User</th>
                        <th className="border border-gray-300 px-4 py-2 text-center text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((group, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-2 text-xs align-top">
                            {group.timestamp.toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-xs font-semibold align-top">
                            {group.supplier}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-xs">
                            <div className="space-y-2">
                              {group.products.map((product, pIdx) => (
                                <div key={pIdx} className="border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                                  <div className="font-semibold text-gray-800">{product.name}</div>
                                  <div className="grid grid-cols-4 gap-2 mt-1 text-gray-600">
                                    <div>
                                      <span className="text-gray-500">Qty Change:</span>{' '}
                                      <span className={product.quantity_change > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                        {product.quantity_change > 0 ? '+' : ''}{product.quantity_change}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Old:</span> {product.old_quantity}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">New:</span> {product.new_quantity}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Cost:</span> {formatCurrency(product.total_cost || 0)}
                                    </div>
                                  </div>
                                  {product.reason && (
                                    <div className="text-gray-500 text-xs mt-1 italic">{product.reason}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-xs text-right font-bold align-top">
                            {formatCurrency(group.totalCost)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-xs align-top">{group.user}</td>
                          <td className="border border-gray-300 px-4 py-2 text-xs align-top text-center">
                            <button
                              onClick={() => {
                                setSelectedReceipt(group);
                                setShowReceiptModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition"
                            >
                              <FaReceipt size={12} /> View Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {!loadingTransactions && groupedTransactions.length > 0 && (
                <div className="mt-4 flex justify-center items-center gap-2">
                  <button
                    onClick={() => setTransactionPage(prev => Math.max(1, prev - 1))}
                    disabled={transactionPage === 1}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {transactionPage} of {totalTransactionPages} ({groupedTransactions.length} transactions)
                  </span>
                  <button
                    onClick={() => setTransactionPage(prev => Math.min(totalTransactionPages, prev + 1))}
                    disabled={transactionPage === totalTransactionPages}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Product History Tab */}
      {activeTab === 'product-history' && (
        <div className="bg-white rounded shadow border-2 border-primary mx-auto max-w-[1400px] overflow-hidden">
          <ProductHistoryModal
            isOpen={true}
            onClose={() => setActiveTab('inventory')}
            token={token}
            embedded={true}
          />
        </div>
      )}

      {/* Manage Stock Modal */}
      {showManageStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-[90vw] max-w-6xl flex flex-col" style={{ maxHeight: '85vh' }}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">Manage Stock</h2>
                <p className="text-sm text-gray-200 mt-1">
                  {suppliers.find(s => s.id === selectedSuppliers[0])?.name || 'Supplier Products'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowManageStockModal(false);
                  setSupplierProducts([]);
                  setSelectedProducts([]);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Content - Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {loadingProducts ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : supplierProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No products found for this supplier.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-primary text-white">
                          <th className="border border-gray-300 px-4 py-2 text-center text-xs w-16">Select</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-xs">Item Number</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-xs">Product Name</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-xs">Category</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-xs">Branch</th>
                          <th className="border border-gray-300 px-4 py-2 text-right text-xs">Quantity</th>
                          <th className="border border-gray-300 px-4 py-2 text-right text-xs">Unit Cost</th>
                          <th className="border border-gray-300 px-4 py-2 text-right text-xs">Retail Price</th>
                          <th className="border border-gray-300 px-4 py-2 text-center text-xs">Reorder Level</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-xs">Remarks</th>
                        </tr>
                      </thead>
                    <tbody>
                      {supplierProducts.map((product, idx) => {
                        const qty = Number(product.quantity || 0);
                        const rlevel = Number(product.reorder_level || 0);
                        let remarks;
                        if (qty === 0) remarks = 'Out of Stock';
                        else if (qty <= rlevel) remarks = 'Low Stock';
                        else remarks = 'In Stock';
                        
                        return (
                          <tr key={product.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedProducts.includes(product.id)}
                                onChange={() => {
                                  setSelectedProducts(prev => {
                                    if (prev.includes(product.id)) {
                                      return prev.filter(id => id !== product.id);
                                    } else {
                                      return [...prev, product.id];
                                    }
                                  });
                                }}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-xs">
                              {formatItemId(product.item_number, product.branch, product.category)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-xs font-semibold">{product.name}</td>
                            <td className="border border-gray-300 px-4 py-2 text-xs">{product.category}</td>
                            <td className="border border-gray-300 px-4 py-2 text-xs">{product.branch}</td>
                            <td className="border border-gray-300 px-4 py-2 text-xs text-right">{qty}</td>
                            <td className="border border-gray-300 px-4 py-2 text-xs text-right">{formatCurrency(product.unit_cost || 0)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-xs text-right">{formatCurrency(product.retail_price || 0)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-xs text-center">{rlevel}</td>
                            <td className="border border-gray-300 px-4 py-2 text-xs">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                remarks === 'Out of Stock' ? 'bg-red-100 text-red-800' :
                                remarks === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {remarks}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>

            {/* Modal Footer - Fixed at bottom */}
            <div className="border-t bg-gray-50 px-6 py-4 flex justify-end flex-shrink-0">
              <button
                onClick={() => {
                  if (selectedProducts.length === 0) {
                    showToast('Please select at least one product to restock', 'error');
                    return;
                  }

                  // Initialize restock data for selected products
                  const initialData = {};
                  selectedProducts.forEach(productId => {
                    const product = supplierProducts.find(p => p.id === productId);
                    initialData[productId] = {
                      quantity: product.reorder_quantity || 10,
                      operation: 'add',
                      transactionType: 'restock',
                      product: product
                    };
                  });

                  setRestockData(initialData);
                  setRestockPage(1); // Reset to first page
                  setShowRestockModal(true);
                }}
                disabled={selectedProducts.length === 0}
                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Restock Selected ({selectedProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Adjust Stock</h2>
                <p className="text-sm text-gray-200 mt-1">
                  {selectedProducts.length} product(s) selected
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setRestockData({});
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Fixed height container for products */}
              <div className="space-y-6" style={{ minHeight: '400px' }}>
                {selectedProducts.slice((restockPage - 1) * productsPerPage, restockPage * productsPerPage).map(productId => {
                  const product = supplierProducts.find(p => p.id === productId);
                  const data = restockData[productId] || {
                    quantity: product.reorder_quantity || 10,
                    operation: 'add',
                    transactionType: 'restock'
                  };

                  return (
                    <div key={productId} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4">{product.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Operation Toggle */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setRestockData(prev => ({
                                ...prev,
                                [productId]: { ...prev[productId], operation: 'add' }
                              }))}
                              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                                data.operation === 'add'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Add
                            </button>
                            <button
                              onClick={() => setRestockData(prev => ({
                                ...prev,
                                [productId]: { ...prev[productId], operation: 'subtract' }
                              }))}
                              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                                data.operation === 'subtract'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Subtract
                            </button>
                          </div>
                        </div>

                        {/* Quantity Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={data.quantity}
                            onChange={(e) => setRestockData(prev => ({
                              ...prev,
                              [productId]: { ...prev[productId], quantity: parseInt(e.target.value) || 0 }
                            }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>

                        {/* Transaction Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                          <select
                            value={data.transactionType}
                            onChange={(e) => setRestockData(prev => ({
                              ...prev,
                              [productId]: { ...prev[productId], transactionType: e.target.value }
                            }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="restock">Restock</option>
                            <option value="damaged">Damaged/Loss</option>
                            <option value="return">Customer Return</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-medium">Current Stock:</span> {product.quantity} | 
                        <span className="font-medium ml-2">New Stock:</span> {
                          data.operation === 'add' 
                            ? product.quantity + (data.quantity || 0)
                            : product.quantity - (data.quantity || 0)
                        }
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {selectedProducts.length > productsPerPage && (
                <div className="mt-6 flex justify-center items-center gap-4">
                  <button
                    onClick={() => setRestockPage(prev => Math.max(1, prev - 1))}
                    disabled={restockPage === 1}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Products {(restockPage - 1) * productsPerPage + 1}-{Math.min(restockPage * productsPerPage, selectedProducts.length)} of {selectedProducts.length}
                  </span>
                  <button
                    onClick={() => setRestockPage(prev => Math.min(Math.ceil(selectedProducts.length / productsPerPage), prev + 1))}
                    disabled={restockPage >= Math.ceil(selectedProducts.length / productsPerPage)}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => {
                    setShowRestockModal(false);
                    setRestockData({});
                    setRestockPage(1);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-8 py-3 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Validate that all selected products have restock data
                    const missingData = selectedProducts.filter(id => !restockData[id] || !restockData[id].quantity);
                    if (missingData.length > 0) {
                      showToast('Please fill in quantity for all selected products', 'error');
                      return;
                    }

                    // Calculate total cost with tax
                    let totalCost = 0;
                    selectedProducts.forEach(productId => {
                      const data = restockData[productId];
                      const product = supplierProducts.find(p => p.id === productId);
                      const cost = (product.unit_cost || product.unitCost) * data.quantity;
                      totalCost += cost;
                    });
                    
                    console.log('Total cost calculated:', totalCost);
                    const totalWithTax = totalCost * 1.12;
                    console.log('Total with tax:', totalWithTax);
                    setCalculatedTotal(totalWithTax);
                    setPaymentAmount('');
                    setShowPaymentModal(true);
                  }}
                  className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold transition"
                >
                  Confirm Adjustments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Receipt Modal */}
      <RestockReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedReceipt(null);
        }}
        restockData={selectedReceipt}
      />

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Confirmation</h2>
            
            {/* Product Breakdown */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Products:</h3>
              <div className="space-y-2 mb-3">
                {selectedProducts.map(productId => {
                  const data = restockData[productId];
                  const product = supplierProducts.find(p => p.id === productId);
                  const unitCost = product.unit_cost || product.unitCost;
                  const totalCost = unitCost * data.quantity;
                  return (
                    <div key={productId} className="flex justify-between text-xs">
                      <span className="text-gray-600">
                        {product.name} x{data.quantity}
                      </span>
                      <span className="font-semibold">{formatCurrency(totalCost)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-gray-300">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm font-semibold">{formatCurrency(calculatedTotal / 1.12)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">VAT_Tax:</span>
                  <span className="text-sm font-semibold">{formatCurrency(calculatedTotal * 0.12 / 1.12)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-base font-bold text-gray-900">Total Amount:</span>
                  <span className="text-base font-bold text-primary">{formatCurrency(calculatedTotal)}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount Paid: <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={formatCurrency(calculatedTotal)}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {paymentAmount && parseFloat(paymentAmount) < calculatedTotal && (
                <p className="text-xs text-red-600 mt-1">
                  Amount paid cannot be less than the total amount
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                }}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const amount = parseFloat(paymentAmount);
                  if (isNaN(amount) || amount <= 0) {
                    showToast('Please enter a valid amount', 'error');
                    return;
                  }
                  if (amount < calculatedTotal) {
                    showToast('Amount paid cannot be less than the total amount', 'error');
                    return;
                  }

                  const selectedSupplier = suppliers.find(s => s.id === selectedSuppliers[0]);
                  
                  try {
                    const adjustmentPromises = selectedProducts.map(productId => {
                      const data = restockData[productId];
                      
                      return axios.post(
                        'http://127.0.0.1:8000/api/inventory/adjust-stock/',
                        {
                          product_id: productId,
                          operation: data.operation === 'add' ? 'ADD' : 'DEDUCT',
                          quantity: parseInt(data.quantity),
                          transaction_type: data.transactionType || 'restock',
                          supplier: selectedSupplier?.name || '',
                          reason: `${data.transactionType || 'restock'} - ${data.operation === 'add' ? 'Added' : 'Removed'} ${data.quantity} units`,
                          amount_paid: amount
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                    });

                    await Promise.all(adjustmentPromises);
                    showToast(`Successfully adjusted ${selectedProducts.length} product(s)`, 'success');
                    setShowPaymentModal(false);
                    setShowRestockModal(false);
                    setShowManageStockModal(false);
                    setRestockData({});
                    setSelectedProducts([]);
                    setRestockPage(1);
                    setPaymentAmount('');
                    fetchInventory();
                    fetchTransactions();
                  } catch (err) {
                    console.error('Error adjusting products:', err);
                    showToast(err.response?.data?.error || 'Failed to adjust products', 'error');
                  }
                }}
                disabled={!paymentAmount || parseFloat(paymentAmount) < calculatedTotal}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />
    </div>
  );
}
