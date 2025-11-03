import React, { useState, useEffect, useCallback } from 'react';
import { FaShoppingCart, FaSearch, FaFilter, FaTimes, FaMinus, FaPlus, FaBox, FaClipboardList, FaStar } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import DecorativeBackground from '../components/DecorativeBackground';

export default function ProductsPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [productRatings, setProductRatings] = useState({});
  
  // Modal state
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedProductFeedback, setSelectedProductFeedback] = useState(null);

  const categories = [
    'All',
    'Pet Food & Treats',
    'Grooming & Hygiene',
    'Health & Wellness',
    'Accessories & Toys',
    'Cages & Bedding',
    'Feeding Supplies',
    'Cleaning Supplies',
  ];

  // Get user-specific cart key
  const getCartKey = useCallback(() => {
    return user ? `cart_${user.id}` : 'cart_guest';
  }, [user]);

  // Load cart from localStorage on mount or when user changes
  useEffect(() => {
    // Wait for user to be loaded before checking localStorage
    if (!user && localStorage.getItem('access')) {
      // User is still loading, wait
      console.log('Waiting for user to load...');
      return;
    }

    const cartKey = getCartKey();
    console.log('Loading cart from:', cartKey);
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('Cart loaded:', parsedCart);
        setCart(parsedCart);
        setCartLoaded(true); // Mark cart as loaded after successful load
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        setCart([]);
        setCartLoaded(true);
      }
    } else {
      console.log('No saved cart found');
      setCart([]); // Clear cart if no saved cart for this user
      setCartLoaded(true); // Mark cart as loaded even if empty
    }
  }, [user, getCartKey]);

  // Save cart to localStorage whenever it changes (but only after initial load)
  useEffect(() => {
    // Don't save if cart hasn't been loaded yet
    if (!cartLoaded) {
      return;
    }

    // Don't save if user is still loading
    if (!user && localStorage.getItem('access')) {
      return;
    }

    const cartKey = getCartKey();
    // Always save cart, even if empty
    localStorage.setItem(cartKey, JSON.stringify(cart));
    console.log('Cart saved to localStorage:', cartKey, cart);
  }, [cart, user, getCartKey, cartLoaded]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/inventory/products/', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      // Only show products that are in stock
      const inStockProducts = data.filter(p => p.quantity > 0);
      setProducts(inStockProducts);
      setFilteredProducts(inStockProducts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchProductRatings = useCallback(async () => {
    try {
      const ratings = await fetch('http://127.0.0.1:8000/api/orders/product-ratings/').then(res => res.json());
      setProductRatings(ratings);
    } catch (err) {
      console.error('Error fetching ratings:', err);
    }
  }, []);

  const filterProducts = useCallback(() => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by branch
    if (selectedBranch !== 'All') {
      filtered = filtered.filter((p) => p.branch === selectedBranch);
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, selectedBranch]);

  useEffect(() => {
    fetchProducts();
    fetchProductRatings();
  }, [fetchProducts, fetchProductRatings]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const viewProductFeedback = async (product) => {
    try {
      const feedbackData = await fetch(`http://127.0.0.1:8000/api/orders/product-feedback/${product.id}/`).then(res => res.json());
      setSelectedProductFeedback(feedbackData);
      setShowFeedbackModal(true);
    } catch (error) {
      console.error('Error fetching product feedback:', error);
      toast.showToast('Failed to load feedback', 'error');
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id && item.type === 'product');
    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + modalQuantity;
      if (newQuantity > product.quantity) {
        toast.showToast(`Only ${product.quantity} units available in stock`, 'error');
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === product.id && item.type === 'product' 
            ? { ...item, quantity: newQuantity } 
            : item
        )
      );
    } else {
      // Add new item
      setCart([...cart, { 
        ...product, 
        type: 'product',
        price: Number(product.unit_cost),
        availableStock: product.quantity,
        quantity: modalQuantity
      }]);
    }
    
    toast.showToast(`Added ${modalQuantity} ${product.name} to cart`, 'success');
    setShowQuantityModal(false);
    setSelectedProduct(null);
    setModalQuantity(1);
  };

  const openQuantityModal = (product) => {
    // Check if user is logged in
    if (!user) {
      toast.showToast('Please login to add items to cart', 'error');
      navigate('/signin');
      return;
    }
    
    setSelectedProduct(product);
    setModalQuantity(1);
    setShowQuantityModal(true);
  };

  const closeQuantityModal = () => {
    setShowQuantityModal(false);
    setSelectedProduct(null);
    setModalQuantity(1);
  };

  const handleModalQuantityChange = (change) => {
    if (!selectedProduct) return;
    const newQuantity = Math.max(1, Math.min(modalQuantity + change, selectedProduct.quantity));
    setModalQuantity(newQuantity);
  };

  const goToCart = () => {
    // Check if user is logged in
    if (!user) {
      toast.showToast('Please login to view cart', 'error');
      navigate('/signin');
      return;
    }
    
    navigate('/cart', { state: { cart } });
  };

  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity === 0) return { text: 'Out of Stock', color: 'text-red-600' };
    if (quantity <= reorderLevel) return { text: 'Low Stock', color: 'text-yellow-600' };
    return { text: 'In Stock', color: 'text-green-600' };
  };

  return (
    <DecorativeBackground variant="bones">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-accent-cream mb-2">Shop Products</h1>
        <p className="text-accent-cream">Browse our wide selection of pet supplies and accessories</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-primary-dark rounded-lg shadow-xl p-4 mb-6 border-2 border-primary">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div className="md:col-span-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent-cream" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-primary border-2 border-primary-dark rounded-lg focus:ring-2 focus:ring-secondary-light focus:border-secondary-light text-accent-cream placeholder-accent-cream"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent-cream" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-primary border-2 border-primary-dark rounded-lg focus:ring-2 focus:ring-secondary-light focus:border-secondary-light appearance-none text-accent-cream"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-primary-dark">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-4 py-2 bg-primary border-2 border-primary-dark rounded-lg focus:ring-2 focus:ring-secondary-light focus:border-secondary-light appearance-none text-accent-cream"
            >
              <option value="All" className="bg-primary-dark">All Branches</option>
              <option value="Matina" className="bg-primary-dark">Matina</option>
              <option value="Toril" className="bg-primary-dark">Toril</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-accent-cream">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-lighter"></div>
        </div>
      ) : (
        <>
          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-accent-cream text-lg">No products found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.quantity, product.reorder_level);
                return (
                  <div
                    key={product.id}
                    className="product-card bg-primary-dark rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden group flex flex-col border-2 border-primary"
                  >
                    {/* Category Badge */}
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-xs text-accent-cream uppercase tracking-wide font-semibold">
                        {product.category}
                      </p>
                    </div>

                    {/* Product Image */}
                    <div className="bg-gradient-to-br from-accent-brown to-secondary h-40 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                      <div className="text-6xl opacity-30 group-hover:scale-110 transition-transform duration-300">
                        🐾
                      </div>
                      {/* Stock Badge */}
                      <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        stockStatus.text === 'In Stock' ? 'bg-secondary-lighter text-primary-darker' :
                        stockStatus.text === 'Low Stock' ? 'bg-secondary-light text-primary-darker' :
                        'bg-red-400 text-white'
                      }`}>
                        {stockStatus.text}
                      </div>
                      {/* Branch Badge */}
                      <div className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-accent-cream">
                        {product.branch}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 flex flex-col flex-grow">
                      {/* Product Name and Price Row */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-accent-cream line-clamp-2 flex-1">
                          {product.name}
                        </h3>
                        <p className="text-2xl font-bold text-secondary-lighter flex-shrink-0">
                          ₱{product.unit_cost ? Number(product.unit_cost).toFixed(2) : '0.00'}
                        </p>
                      </div>

                      {/* Divider Line */}
                      <div className="border-b-2 border-primary mb-3"></div>

                      {/* Ratings and Add to Cart Row */}
                      <div className="flex justify-between items-center">
                        {/* Ratings */}
                        <div>
                          {productRatings[product.id] && productRatings[product.id].review_count > 0 ? (
                            <button
                              onClick={() => viewProductFeedback(product)}
                              className="flex items-center gap-2 text-sm hover:text-secondary-lighter transition-colors"
                            >
                              <div className="flex items-center gap-1">
                                <FaStar className="text-secondary-lighter" />
                                <span className="font-semibold text-accent-cream">
                                  {productRatings[product.id].average_rating.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-accent-cream text-xs">
                                ({productRatings[product.id].review_count})
                              </span>
                            </button>
                          ) : (
                            <p className="text-xs text-accent-cream">No ratings yet</p>
                          )}
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          onClick={() => openQuantityModal(product)}
                          disabled={product.quantity === 0}
                          className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-md text-sm ${
                            product.quantity === 0
                              ? 'bg-primary text-accent-cream cursor-not-allowed'
                              : 'bg-secondary text-accent-cream hover:bg-secondary-light'
                          }`}
                          title={!user ? 'Login required to add to cart' : ''}
                        >
                          <FaShoppingCart />
                          {product.quantity === 0 ? 'Out of Stock' : !user ? 'Login' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Quantity Selection Modal */}
      {showQuantityModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Select Quantity</h3>
              <button
                onClick={closeQuantityModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Product Info */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-1">{selectedProduct.name}</h4>
              <p className="text-sm text-gray-500 mb-2">{selectedProduct.category}</p>
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold text-blue-600">
                  ₱{Number(selectedProduct.unit_cost).toFixed(2)} each
                </p>
                <p className="text-sm text-gray-600">
                  {selectedProduct.quantity} available
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Quantity
              </label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => handleModalQuantityChange(-1)}
                  disabled={modalQuantity <= 1}
                  className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaMinus size={16} />
                </button>
                <div className="text-center">
                  <input
                    type="number"
                    value={modalQuantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setModalQuantity(Math.max(1, Math.min(value, selectedProduct.quantity)));
                    }}
                    className="w-20 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg py-2"
                    min="1"
                    max={selectedProduct.quantity}
                  />
                  <p className="text-xs text-gray-500 mt-1">units</p>
                </div>
                <button
                  onClick={() => handleModalQuantityChange(1)}
                  disabled={modalQuantity >= selectedProduct.quantity}
                  className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaPlus size={16} />
                </button>
              </div>
            </div>

            {/* Total Price */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Price:</span>
                <span className="text-2xl font-bold text-gray-900">
                  ₱{(Number(selectedProduct.unit_cost) * modalQuantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={closeQuantityModal}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => addToCart(selectedProduct)}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <FaShoppingCart />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast {...toast} />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        {/* Admin Orders Button - Only for staff */}
        {user && user.is_staff && (
          <button
            onClick={() => navigate('/admin/orders')}
            className="bg-red-600 text-white rounded-full p-4 shadow-lg hover:bg-red-700 cursor-pointer transition-transform hover:scale-110 relative group"
            title="Admin: All Orders"
          >
            <FaClipboardList size={24} />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Admin: All Orders
            </span>
          </button>
        )}
        
        {/* Debug: Log user info */}
        {console.log('User data:', user)}

        {/* My Orders Button */}
        {user && (
          <button
            onClick={() => navigate('/my-orders')}
            className="bg-yellow-500 text-white rounded-full p-4 shadow-lg hover:bg-yellow-600 cursor-pointer transition-transform hover:scale-110 relative group"
            title="My Orders"
          >
            <FaBox size={24} />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              My Orders
            </span>
          </button>
        )}

        {/* Feedback Button */}
        {user && (
          <button
            onClick={() => navigate('/feedback')}
            className="bg-purple-500 text-white rounded-full p-4 shadow-lg hover:bg-purple-600 cursor-pointer transition-transform hover:scale-110 relative group"
            title="Give Feedback"
          >
            <FaStar size={24} />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Give Feedback
            </span>
          </button>
        )}

        {/* Cart Button - Always visible */}
        <button
          onClick={goToCart}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 cursor-pointer transition-transform hover:scale-110 relative group"
          title={user ? 'View Cart' : 'Login to view cart'}
        >
          <FaShoppingCart size={24} />
          {user && cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
          {!user && (
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Login Required
            </span>
          )}
        </button>
      </div>

      {/* Product Feedback Modal */}
      {showFeedbackModal && selectedProductFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowFeedbackModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-blue-600 text-white p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedProductFeedback.product_name}</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <FaStar className="text-yellow-300" size={24} />
                      <span className="text-3xl font-bold">{selectedProductFeedback.average_rating.toFixed(1)}</span>
                    </div>
                    <span className="text-blue-100">
                      {selectedProductFeedback.total_reviews} {selectedProductFeedback.total_reviews === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <FaTimes size={24} />
                </button>
              </div>
            </div>

            {/* Feedback List */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
              {selectedProductFeedback.feedbacks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {selectedProductFeedback.feedbacks.map((feedback) => (
                    <div key={feedback.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {/* User Info */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {feedback.user_first_name && feedback.user_last_name
                              ? `${feedback.user_first_name} ${feedback.user_last_name}`
                              : feedback.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(feedback.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        {/* Rating Stars */}
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              className={star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}
                              size={16}
                            />
                          ))}
                        </div>
                      </div>
                      {/* Comment */}
                      {feedback.comment && (
                        <p className="text-gray-700 mt-2">{feedback.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </DecorativeBackground>
  );
}
