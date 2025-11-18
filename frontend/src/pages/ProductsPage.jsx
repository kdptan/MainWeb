import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaShoppingCart, FaSearch, FaFilter, FaTimes, FaMinus, FaPlus, FaStar, FaCommentDots, FaBox, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import DecorativeBackground from '../components/DecorativeBackground';
import { formatCurrency } from '../utils/formatters';
import { orderService } from '../services/orderService';
import productsHero from '../assets/DOG3.png';

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
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [adminPendingOrdersCount, setAdminPendingOrdersCount] = useState(0);
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);
  
  // Modal state
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const modalRef = useRef(null);

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

  // Scroll modal to center when it opens
  useEffect(() => {
    if (showQuantityModal && modalRef.current) {
      setTimeout(() => {
        modalRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [showQuantityModal]);

  // Fetch pending orders count
  useEffect(() => {
    const fetchPendingOrdersCount = async () => {
      if (!user) return;
      
      try {
        const data = await orderService.getOrders({ status: 'pending' });
        setPendingOrdersCount(data.length);

        // If user is staff, also fetch all pending orders for admin
        if (user.is_staff) {
          const adminData = await orderService.getAllOrdersAdmin({ status: 'pending' });
          setAdminPendingOrdersCount(adminData.length);
        }
      } catch (error) {
        console.error('Error fetching pending orders count:', error);
      }
    };

    fetchPendingOrdersCount();
  }, [user]);

  // Fetch pending feedback count
  useEffect(() => {
    const fetchPendingFeedbackCount = async () => {
      if (!user) return;
      
      try {
        // Fetch completed orders without feedback
        const orders = await orderService.getOrders({ status: 'completed' });
        const ordersWithoutFeedback = orders.filter(order => !order.has_feedback);
        
        // Fetch completed appointments without feedback (import appointmentService if needed)
        const appointmentService = await import('../services/appointmentService').then(m => m.appointmentService);
        const appointments = await appointmentService.getAppointments({ status: 'completed' });
        const appointmentsWithoutFeedback = (appointments || []).filter(apt => !apt.has_feedback);
        
        setPendingFeedbackCount(ordersWithoutFeedback.length + appointmentsWithoutFeedback.length);
      } catch (error) {
        console.error('Error fetching pending feedback count:', error);
      }
    };

    fetchPendingFeedbackCount();
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
    
    // Dispatch custom event to notify other components that cart has changed
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
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
      // Show all products regardless of stock status
      setProducts(data);
      setFilteredProducts(data);
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
        price: Number(product.retail_price),
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

  // Scroll to center and focus modal when it opens
  useEffect(() => {
    if (showQuantityModal && modalRef.current) {
      // Scroll to center of viewport
      modalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus the modal container for accessibility
      modalRef.current.focus();
    }
  }, [showQuantityModal]);

  return (
    <DecorativeBackground variant="bones">
      <div className="bg-chonky-white min-h-screen">
        {/* Hero Section */}
        <section className="bg-chonky-brown pt-16 pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[450px]">
              {/* Left Side: Title, Tagline, and Search */}
              <div className="text-left">
                <h1 className="hero-title mb-4">
                  Shop Our Products
                </h1>
                <p className="text-body-lg text-accent-cream leading-relaxed mb-6">
                  Browse our wide selection of pet supplies and accessories.
                </p>
                {/* Search and Filters */}
                <div className="bg-primary-dark rounded-3xl shadow-xl p-4 border-2 border-primary">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-chonky-white" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-primary border-2 border-primary-dark rounded-3xl focus:ring-2 focus:ring-secondary-light focus:border-secondary-light text-lg text-chonky-white placeholder-chonky-white"
                      />
                    </div>
                    {/* Category Filter */}
                    <div className="relative">
                      <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-chonky-white" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-primary border-2 border-primary-dark rounded-3xl focus:ring-2 focus:ring-secondary-light focus:border-secondary-light appearance-none text-lg text-chonky-white"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat} className="bg-primary-dark text-base">
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-chonky-white text-center">
                    Showing {filteredProducts.length} of {products.length} products
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-4 flex flex-col md:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => navigate('/my-orders')}
                    className="px-6 py-3 rounded-3xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-md border-2 border-secondary text-accent-cream hover:bg-secondary hover:text-chonky-brown relative"
                  >
                    <FaBox />
                    My Orders
                    {pendingOrdersCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                        {pendingOrdersCount}
                      </span>
                    )}
                  </button>
                  {user && user.is_staff && (
                    <button
                      onClick={() => navigate('/admin/orders')}
                      className="px-6 py-3 rounded-3xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-md border-2 border-red-500 text-accent-cream hover:bg-red-500 hover:text-white relative"
                    >
                      <FaClipboardList />
                      Admin Orders
                      {adminPendingOrdersCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-yellow-500 text-chonky-brown text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                          {adminPendingOrdersCount}
                        </span>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/feedback')}
                    className="px-6 py-3 rounded-3xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-md border-2 border-secondary text-accent-cream hover:bg-secondary hover:text-chonky-brown relative"
                  >
                    <FaCommentDots />
                    Give Feedback
                    {pendingFeedbackCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                        {pendingFeedbackCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              {/* Right: Products Hero Image */}
              <div className="flex justify-center self-end">
                <img 
                  src={productsHero} 
                  alt="Happy dog with products" 
                  className="max-w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-lighter"></div>
        </div>
      ) : (
        <section className="bg-chonky-khaki">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-chonky-white shadow-md">
            <div className="py-8">
              {/* Branch Filter */}
              <div className="mb-6 max-w-xs">
                <label className="block text-sm font-medium text-chonky-brown mb-2">Filter by Branch:</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-2 bg-white border-2 border-chonky-brown-light rounded-lg focus:ring-2 focus:ring-secondary-light focus:border-secondary-light appearance-none text-chonky-brown"
                >
                  <option value="All">All Branches</option>
                  <option value="Matina">Matina</option>
                  <option value="Toril">Toril</option>
                </select>
              </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
                  <p className="text-chonky-brown text-lg">No products found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product, index) => {
                const cardVariants = [
                  { // Original
                    bg: 'bg-primary-dark',
                    border: 'border-primary',
                    button: 'bg-secondary text-chonky-white hover:bg-btn-yellow hover:text-chonky-brown',
                  },
                  { // Variant 2
                    bg: 'bg-chonky-pink',
                    border: 'border-chonky-pinklight',
                    button: 'bg-secondary text-chonky-white hover:bg-btn-yellow hover:text-chonky-brown',
                  },
                  { // Variant 3
                    bg: 'bg-chonky-khaki',
                    border: 'border-chonky-offwhite',
                    button: 'bg-secondary text-chonky-white hover:bg-btn-yellow hover:text-chonky-brown',
                  },
                ];
                const variant = cardVariants[index % 3];
                return (
                  <div
                    key={product.id}
                    className={`product-card ${variant.bg} rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden group flex flex-col border-2 ${variant.border}`}
                  >
                    {/* Category Badge */}
                    <div className="px-4 pt-4 pb-2">
                      <p 
                        className="text-sm text-accent-cream uppercase tracking-wider font-bold"
                        style={{ fontFamily: "'Martel Sans', sans-serif" }}
                      >
                        {product.category}
                      </p>
                    </div>

                    {/* Product Image */}
                    <div className="px-4">
                      <div className="bg-gradient-to-br from-accent-brown to-secondary h-40 flex items-center justify-center relative overflow-hidden flex-shrink-0 rounded-3xl">
                        <div className="text-6xl opacity-30 group-hover:scale-110 transition-transform duration-300">
                          🐾
                        </div>
                        {/* Branch Badge */}
                        <div className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-accent-cream">
                          {product.branch}
                        </div>
                        
                        {/* Stock Status Badge */}
                        <div 
                          className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1"
                          style={{backgroundColor: product.quantity > 10 ? '#10b981' : product.quantity > 0 ? '#f59e0b' : '#ef4444'}}
                        >
                          <span>{product.quantity > 10 ? '✓ In Stock' : product.quantity > 0 ? '⚠ Low' : '✕ Out'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 pt-3 flex flex-col flex-grow">
                      {/* Product Name and Price Row */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <h3 className="heading-card text-accent-cream line-clamp-2 flex-1">
                          {product.name}
                        </h3>
                        <p className="price price-medium text-secondary-lighter flex-shrink-0">
                          {product.retail_price ? formatCurrency(product.retail_price) : formatCurrency(0)}
                        </p>
                      </div>

                      {/* Ratings and Add to Cart Row */}
                      <div className="flex justify-between items-center mb-3">
                        {/* Ratings */}
                        <div>
                          {productRatings[product.id] && productRatings[product.id].review_count > 0 ? (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <FaStar className="text-secondary-lighter" />
                                <span className="font-semibold text-accent-cream">
                                  {productRatings[product.id].average_rating.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-accent-cream text-xs">
                                ({productRatings[product.id].review_count})
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-accent-cream">No ratings yet</p>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <div>
                        <button
                          onClick={() => openQuantityModal(product)}
                          className={`py-2 px-3 rounded-3xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-md text-sm ${variant.button}`}
                          title={!user ? 'Login required to add to cart' : ''}
                        >
                          <FaShoppingCart />
                          {!user ? 'Login' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </div>
          </div>
        </section>
      )}

      {/* Quantity Selection Modal */}
      {showQuantityModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={modalRef} tabIndex={-1} className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-chonky-brown">Select Quantity</h3>
              <button
                onClick={closeQuantityModal}
                className="text-gray-400 hover:text-chonky-brown transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Product Info */}
            <div className="mb-6">
              <h4 className="font-semibold text-chonky-brown mb-1">{selectedProduct.name}</h4>
              <p className="text-sm text-secondary mb-2">{selectedProduct.category}</p>
              <p className="text-lg font-bold text-chonky-brown">
                {formatCurrency(selectedProduct.retail_price)} each
              </p>
              
              {/* Available Units */}
              <div className="mt-3 p-2 rounded-lg" style={{backgroundColor: selectedProduct.quantity > 10 ? '#10b98133' : selectedProduct.quantity > 0 ? '#f59e0b33' : '#ef444433'}}>
                <p className="text-sm font-semibold" style={{color: selectedProduct.quantity > 10 ? '#059669' : selectedProduct.quantity > 0 ? '#d97706' : '#dc2626'}}>
                  Available: <span className="font-bold">{selectedProduct.quantity} units</span>
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
                      const maxQuantity = selectedProduct.quantity;
                      setModalQuantity(Math.max(1, Math.min(value, maxQuantity)));
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
                  {formatCurrency((Number(selectedProduct.retail_price) * modalQuantity))}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={closeQuantityModal}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-3xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => addToCart(selectedProduct)}
                className="flex-1 px-4 py-3 bg-secondary text-white rounded-3xl font-semibold hover:bg-btn-yellow transition-colors flex items-center justify-center gap-2"
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

      </div>
    </DecorativeBackground>
  );
}
