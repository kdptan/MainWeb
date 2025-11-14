import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaBox, FaCheck, FaInfoCircle, FaToggleOn, FaToggleOff } from 'react-icons/fa';

// Step 1: Product Selection Modal
function SelectProductsModal({ isOpen, onClose, onProceed, token, embedded = false }) {
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductsForRestock, setSelectedProductsForRestock] = useState(new Set());
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [error, setError] = useState('');

  const fetchAllProducts = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/inventory/products/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products');
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      fetchAllProducts();
      setError('');
    }
  }, [isOpen, fetchAllProducts]);

  const toggleProductForRestock = (product) => {
    const newSelected = new Set(selectedProductsForRestock);
    newSelected.has(product.id) ? newSelected.delete(product.id) : newSelected.add(product.id);
    setSelectedProductsForRestock(newSelected);
  };

  const filteredProducts = allProducts.filter(product => {
    const matchCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchBranch = filterBranch === 'all' || product.branch === filterBranch;
    return matchCategory && matchBranch;
  });

  const categories = ['all', ...new Set(allProducts.map(p => p.category))];
  const branches = ['all', ...new Set(allProducts.map(p => p.branch))];

  if (!isOpen) return null;

  const selectedProducts = Array.from(selectedProductsForRestock)
    .map(id => allProducts.find(p => p.id === id))
    .filter(Boolean);

  const renderModalContent = () => {
    return (
      <div className="bg-white rounded-lg shadow-2xl w-full flex flex-col">
        {/* Content - NOT scrollable */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* Filters on the left */}
          <div className="flex gap-3 flex-shrink-0">
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Branch</label>
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="px-3 py-1 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                >
                  {branches.map(branch => (
                    <option key={branch} value={branch}>
                      {branch === 'all' ? 'All Branches' : branch}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-gray-600 whitespace-nowrap">
                {filteredProducts.length} items
              </div>
            </div>
          </div>

          {/* Table - Full Width */}
          <div className="flex-1 min-h-0 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-amber-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Select</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Item ID</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Product Name</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Supplier</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Current Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                      No products available
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product.id} className="border-b hover:bg-amber-50 transition">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProductsForRestock.has(product.id)}
                          onChange={() => toggleProductForRestock(product)}
                          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{product.formatted_id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.supplier || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.quantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
              <FaInfoCircle className="text-red-600 mt-1 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => onProceed(Array.from(selectedProductsForRestock).map(id => allProducts.find(p => p.id === id)).filter(Boolean))}
            disabled={selectedProducts.length === 0}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCheck /> Manage Stock ({selectedProducts.length})
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return embedded ? renderModalContent() : (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-[90vw] max-w-5xl max-h-[90vh]">
        {renderModalContent()}
      </div>
    </div>
  );
}

// Main Component - Manages both modals
export default function BatchRestockingModal({ isOpen, onClose, products, token, onRestockSuccess, embedded = false }) {
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSelectModalOpen(true);
      document.body.style.overflow = 'hidden';
    } else {
      setSelectModalOpen(false);
      setSelectedProducts([]);
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleProceedToConfirm = (products) => {
    setSelectedProducts(products);
    setSelectModalOpen(false);
    setAdjustmentModalOpen(true);
  };

  const handleCloseAdjustment = () => {
    setAdjustmentModalOpen(false);
    setSelectedProducts([]);
    setSelectModalOpen(true);
  };

  const handleAdjustmentSuccess = (message) => {
    onRestockSuccess(message);
    setAdjustmentModalOpen(false);
    setSelectModalOpen(false);
    onClose();
  };

  return (
    <>
      <SelectProductsModal
        isOpen={selectModalOpen}
        onClose={() => {
          setSelectModalOpen(false);
          onClose();
        }}
        onProceed={handleProceedToConfirm}
        token={token}
        embedded={embedded}
      />
      <StockAdjustmentModal
        isOpen={adjustmentModalOpen}
        onClose={handleCloseAdjustment}
        selectedProducts={selectedProducts}
        token={token}
        onAdjustmentSuccess={handleAdjustmentSuccess}
      />
    </>
  );
}

// Step 2: Stock Adjustment Modal
function StockAdjustmentModal({ isOpen, onClose, selectedProducts, token, onAdjustmentSuccess }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [adjustedProducts, setAdjustedProducts] = useState([]);
  const [isAddMode, setIsAddMode] = useState(true);
  const [transactionType, setTransactionType] = useState('restock');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentProduct = selectedProducts[currentIndex];
  const isFirstProduct = currentIndex === 0;
  const isLastProduct = currentIndex === selectedProducts.length - 1;

  const handleApplyAdjustment = async () => {
    if (!quantity || quantity === '0') {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call the backend API to record the adjustment
      const response = await fetch('http://127.0.0.1:8000/api/inventory/adjust-stock/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: currentProduct.id,
          operation: isAddMode ? 'ADD' : 'DEDUCT',
          transaction_type: transactionType,
          quantity: parseInt(quantity),
          reason: `Manual adjustment - ${transactionType}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to apply adjustment');
        setLoading(false);
        return;
      }

      await response.json();

      // Record this adjustment
      const updatedAdjustedProducts = [...adjustedProducts, {
        productId: currentProduct.id,
        productName: currentProduct.name,
        operation: isAddMode ? 'ADD' : 'DEDUCT',
        transactionType: transactionType,
        quantity: parseInt(quantity)
      }];
      setAdjustedProducts(updatedAdjustedProducts);

      // Move to next product or finish
      if (isLastProduct) {
        // All products adjusted, show success
        onAdjustmentSuccess(`Successfully adjusted ${updatedAdjustedProducts.length} product(s)`);
        onClose();
      } else {
        // Move to next product
        setCurrentIndex(currentIndex + 1);
        setQuantity('');
        setIsAddMode(true);
        setTransactionType('restock');
      }
    } catch (err) {
      console.error('Error applying adjustment:', err);
      setError('Failed to apply adjustment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setQuantity('');
      setIsAddMode(true);
      setTransactionType('restock');
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-4">
      <div className="bg-white rounded-lg shadow-2xl w-[90vw] max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <FaBox className="text-lg" />
            <div>
              <h2 className="text-lg font-bold">Adjust Stock Quantity</h2>
              <p className="text-xs text-amber-100">Product {currentIndex + 1} of {selectedProducts.length}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Current Product Card */}
          {currentProduct && (
            <div className="mb-4 p-3 bg-gray-100 border-l-4 border-amber-600 rounded-lg">
              <p className="text-xs text-gray-500 font-semibold mb-1">Current Product</p>
              <p className="text-sm font-bold text-gray-800">{currentProduct.name}</p>
              <p className="text-xs text-gray-600">ID: {currentProduct.formatted_id || currentProduct.id}</p>
              <p className="text-xs text-gray-600">Current Stock: {currentProduct.quantity || 0}</p>
            </div>
          )}

          {/* Add/Deduct Toggle */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Operation</label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddMode(true)}
                className={`flex-1 px-2 py-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition text-xs ${
                  isAddMode
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {isAddMode ? <FaToggleOn size={14} /> : <FaToggleOff size={14} />} ADD
              </button>
              <button
                onClick={() => setIsAddMode(false)}
                className={`flex-1 px-2 py-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition text-xs ${
                  !isAddMode
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {!isAddMode ? <FaToggleOn size={14} /> : <FaToggleOff size={14} />} DEDUCT
              </button>
            </div>
          </div>

          {/* Transaction Type */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reason/Transaction Type</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="w-full px-2 py-1 text-xs border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
            >
              <option value="restock">Restock</option>
              <option value="adjustment">Adjustment</option>
              <option value="damaged">Damaged/Loss</option>
              <option value="return">Customer Return</option>
            </select>
          </div>

          {/* Quantity Input */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full px-2 py-1 text-xs border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
              min="0"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border-2 border-red-300 text-red-800 px-2 py-2 rounded-lg flex items-start gap-2 text-xs">
              <FaInfoCircle className="text-red-600 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="border-t bg-gray-50 p-3 flex gap-2 flex-shrink-0">
          <button
            onClick={handlePrevious}
            disabled={loading || isFirstProduct}
            className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-2 py-1.5 text-xs bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyAdjustment}
            disabled={loading || !quantity || quantity === '0'}
            className="flex-1 px-2 py-1.5 text-xs bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isLastProduct ? (<><FaCheck size={12} /> Finish</>) : (<><FaCheck size={12} /> Next</>))}
          </button>
        </div>
      </div>
    </div>
  );
}

