import React, { useState, useEffect, useCallback } from 'react';
import { FaHistory } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatters';

export default function ProductHistoryModal({ isOpen, onClose, token, embedded = false }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, addition, restock, sale, adjustment, damaged, return
  const [branch, setBranch] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Disable body scroll when modal is open (only if not embedded)
  useEffect(() => {
    if (!embedded && isOpen) {
      document.body.style.overflow = 'hidden';
    } else if (!embedded) {
      document.body.style.overflow = 'unset';
    }
    return () => {
      if (!embedded) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, embedded]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      let url = 'http://127.0.0.1:8000/api/inventory/history/';
      const params = [];
      
      if (filter !== 'all') {
        params.push(`transaction_type=${filter}`);
      }
      if (branch !== 'all') {
        params.push(`branch=${branch}`);
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, branch, token]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  const getTransactionColor = (type) => {
    switch (type) {
      case 'addition':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'restock':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'sale':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'damaged':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'return':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'addition':
        return '✨';
      case 'restock':
        return '📦';
      case 'sale':
        return '🛒';
      case 'adjustment':
        return '📝';
      case 'damaged':
        return '⚠️';
      case 'return':
        return '↩️';
      default:
        return '📊';
    }
  };

  if (!isOpen) return null;

  const historyContent = (
    <div className="bg-white rounded-lg shadow-2xl w-[85vw] max-w-[1400px] max-h-[90vh] flex flex-col mx-auto">
        {/* Filters Header */}
        <div className="sticky top-0 bg-gray-50 p-3 z-10 border-b border-gray-200">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Transaction Type</label>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-gray-900 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all" className="text-gray-900">All Transactions</option>
                <option value="addition" className="text-gray-900">Product Addition</option>
                <option value="restock" className="text-gray-900">Restock</option>
                <option value="sale" className="text-gray-900">Sale</option>
                <option value="adjustment" className="text-gray-900">Adjustment</option>
                <option value="damaged" className="text-gray-900">Damaged/Loss</option>
                <option value="return" className="text-gray-900">Customer Return</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Branch</label>
              <select
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-gray-900 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all" className="text-gray-900">All Branches</option>
                <option value="Matina" className="text-gray-900">Matina</option>
                <option value="Toril" className="text-gray-900">Toril</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-xs font-semibold text-gray-700">
                Total Records: <span className="text-blue-600">{history.length}</span>
              </div>
            </div>

            <div className="flex items-end">
              <div className="text-xs font-semibold text-gray-700">
                Page <span className="text-blue-600">{currentPage}</span> of <span className="text-blue-600">{Math.ceil(history.length / itemsPerPage)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <FaHistory className="text-4xl mx-auto mb-2 opacity-50" />
              <p>No inventory history found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr className="border-b-2 border-gray-300">
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300">Date & Time</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300">Product</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300">Item ID</th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300">Transaction</th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300">Qty Change</th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300">Old Stock</th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300">New Stock</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 border-r border-gray-300">Unit Cost</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 border-r border-gray-300">Total Cost</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300">User</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300">Supplier</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                        <td className="px-2 py-2 text-xs whitespace-nowrap border-r border-gray-300">
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-xs font-medium text-gray-900 border-r border-gray-300">
                          {item.product_name}
                        </td>
                        <td className="px-2 py-2 text-xs font-mono text-gray-600 border-r border-gray-300">
                          {item.product_formatted_id}
                        </td>
                        <td className="px-2 py-2 text-center border-r border-gray-300">
                          <span className={`px-2 py-0.5 rounded-lg border-2 font-semibold text-xs whitespace-nowrap inline-block ${getTransactionColor(item.transaction_type)}`}>
                            {getTransactionIcon(item.transaction_type)} {item.transaction_type.toUpperCase()}
                          </span>
                        </td>
                        <td className={`px-2 py-2 text-center text-xs font-bold border-r border-gray-300 ${item.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.quantity_change > 0 ? '+' : ''}{item.quantity_change}
                        </td>
                    <td className="px-2 py-2 text-center text-xs text-gray-600 border-r border-gray-300">
                      {item.old_quantity}
                    </td>
                    <td className="px-2 py-2 text-center text-xs font-semibold text-gray-900 border-r border-gray-300">
                      {item.new_quantity}
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-medium text-gray-700 border-r border-gray-300">
                      {item.unit_cost ? formatCurrency(parseFloat(item.unit_cost)) : '—'}
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-bold text-blue-600 border-r border-gray-300">
                      {item.total_cost ? formatCurrency(parseFloat(item.total_cost)) : '—'}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-700 border-r border-gray-300">
                      {item.user_name || 'System'}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-600 border-r border-gray-300">
                      {item.supplier || '—'}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-600 max-w-xs truncate">
                      {item.reason || '—'}
                    </td>
                  </tr>
                ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="border-t p-3 bg-gray-50 flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, history.length)} of {history.length} records
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(Math.ceil(history.length / itemsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(history.length / itemsPerPage)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
    </div>
  );

  const historyWrapper = (content) => {
    if (embedded) {
      return <div className="w-full">{content}</div>;
    }
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 z-50">
        {content}
      </div>
    );
  };

  return historyWrapper(historyContent);
}
