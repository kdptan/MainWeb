import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus, FaShoppingBag, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast';
import { formatCurrency } from '../utils/formatters';

export default function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('Matina');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Get user-specific cart key
  const getCartKey = useCallback(() => {
    return user ? `cart_${user.id}` : 'cart_guest';
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    // Wait for auth to settle
    if (!user && !localStorage.getItem('access')) {
      toast.showToast('Please login to access cart', 'error');
      navigate('/signin');
    }
  }, [user, navigate, toast]);

  // Load cart when user is available or location state changes
  useEffect(() => {
    // Wait for user to be loaded before checking localStorage
    if (!user && localStorage.getItem('access')) {
      // User is still loading, wait
      console.log('CartPage: Waiting for user to load...');
      return;
    }

    const cartKey = getCartKey();
    console.log('CartPage: Loading cart from:', cartKey);
    const cartFromState = location.state?.cart;
    const cartFromStorage = localStorage.getItem(cartKey);
    
    if (cartFromState && cartFromState.length > 0) {
      console.log('CartPage: Loading from location state:', cartFromState);
      setCart(cartFromState);
      localStorage.setItem(cartKey, JSON.stringify(cartFromState));
      setCartLoaded(true);
      
      // Auto-set branch based on first product in cart
      const firstProduct = cartFromState.find(item => item.type === 'product' && item.branch);
      if (firstProduct) {
        setSelectedBranch(firstProduct.branch);
      }
    } else if (cartFromStorage) {
      try {
        const parsedCart = JSON.parse(cartFromStorage);
        console.log('CartPage: Loading from localStorage:', parsedCart);
        setCart(parsedCart);
        setCartLoaded(true);
        
        // Auto-set branch based on first product in cart
        const firstProduct = parsedCart.find(item => item.type === 'product' && item.branch);
        if (firstProduct) {
          setSelectedBranch(firstProduct.branch);
        }
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        setCart([]);
        setCartLoaded(true);
      }
    } else {
      console.log('CartPage: No cart found, starting empty');
      setCart([]);
      setCartLoaded(true);
    }
  }, [location.state, user, getCartKey]);

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
    localStorage.setItem(cartKey, JSON.stringify(cart));
    console.log('Cart saved to localStorage:', cartKey, cart);
  }, [cart, user, getCartKey, cartLoaded]);

  // Check if cart has mixed branches
  const getCartBranches = () => {
    const branches = new Set(
      cart
        .filter(item => item.type === 'product' && item.branch)
        .map(item => item.branch)
    );
    return Array.from(branches);
  };

  const hasMixedBranches = () => {
    const branches = getCartBranches();
    return branches.length > 1;
  };

  const updateQuantity = (itemId, itemType, change) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === itemId && item.type === itemType) {
          const newQuantity = Math.max(1, item.quantity + change);
          // Don't allow quantity to exceed available stock for products
          if (item.type === 'product' && newQuantity > item.availableStock) {
            toast.showToast(`Only ${item.availableStock} units available`, 'error');
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeItem = (itemId, itemType) => {
    setCart((prevCart) => prevCart.filter((item) => !(item.id === itemId && item.type === itemType)));
    toast.showToast('Item removed from cart', 'info');
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.showToast('Please login to place an order', 'error');
      navigate('/signin');
      return;
    }

    if (cart.length === 0) {
      toast.showToast('Cart is empty', 'error');
      return;
    }

    // Validate no mixed branches
    if (hasMixedBranches()) {
      toast.showToast('Cannot order from multiple branches. Please remove items from one branch.', 'error');
      return;
    }

    // Validate stock availability for all products
    const stockErrors = [];
    cart.forEach(item => {
      if (item.type === 'product' && item.quantity > item.availableStock) {
        stockErrors.push(`${item.name}: Only ${item.availableStock} units available`);
      }
    });

    if (stockErrors.length > 0) {
      toast.showToast(stockErrors[0], 'error');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        branch: selectedBranch,
        notes: notes,
        items: cart.map((item) => ({
          item_type: item.type, // 'product' or 'service'
          id: item.id,
          quantity: item.quantity,
        })),
      };

      await orderService.createOrder(orderData);
      
      // Clear cart
      const cartKey = getCartKey();
      setCart([]);
      localStorage.removeItem(cartKey);
      
      toast.showToast('Order placed successfully!', 'success');
      
      // Navigate to orders page after a short delay
      setTimeout(() => {
        navigate('/my-orders');
      }, 1500);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.showToast(
        error.response?.data?.error || 'Failed to place order. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const continueShopping = () => {
    // Save cart to localStorage before navigating
    const cartKey = getCartKey();
    localStorage.setItem(cartKey, JSON.stringify(cart));
    navigate('/products');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Toast {...toast} />
        <div className="mb-8">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-3xl hover:bg-btn-yellow transition-colors font-semibold"
          >
            <FaArrowLeft /> Back to Products
          </button>
        </div>
        <div className="text-center py-20">
          <FaShoppingBag className="mx-auto text-6xl text-secondary/50 mb-4" />
          <h2 className="heading-main text-chonky-white mb-2">Your cart is empty</h2>
          <p className="text-gray-300 mb-6">Add some items to get started!</p>
          <button
            onClick={continueShopping}
            className="bg-secondary text-white px-6 py-3 rounded-3xl hover:bg-btn-yellow transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toast {...toast} />
      
      {/* Back Button */}
      <button
        onClick={() => navigate('/products')}
        className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-3xl hover:bg-btn-yellow hover:text-chonky-brown transition-colors font-semibold mb-6"
      >
        <FaArrowLeft /> Back to Products
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="display-md text-chonky-white mb-2">Shopping Cart</h1>
        <p className="text-chonky-white text-lg">Review your items and checkout</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-chonky-white rounded-3xl shadow-md p-6">
            <h2 className="heading-card text-chonky-brown mb-4">
              Cart Items ({cart.length})
            </h2>
            
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center gap-4 p-4 border border-secondary rounded-3xl hover:border-btn-yellow transition-colors"
                >
                  {/* Item Image/Icon */}
                  <div className="bg-accent-peach w-20 h-20 rounded-3xl flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">
                      {item.type === 'product' ? '🐾' : '✨'}
                    </span>
                  </div>

                  {/* Item Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-chonky-brown">{item.name}</h3>
                    <p className="text-sm text-chonky-poop">
                      {item.type === 'product' ? item.category : 'Service'}
                    </p>
                    {item.type === 'product' && item.branch && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold bg-brand-sand text-chonky-brown rounded-3xl">
                        {item.branch} Branch
                      </span>
                    )}
                    <p className="text-sm text-chonky-brown mt-1">
                      {formatCurrency(item.price)} each
                    </p>
                    {item.type === 'product' && (
                      <p className="text-xs text-chonky-khaki mt-1">
                        {item.availableStock} units available
                      </p>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.type, -1)}
                      className="p-2 rounded-3xl bg-chonky-khaki hover:bg-chonky-poop transition-colors text-chonky-white"
                      disabled={item.quantity <= 1}
                    >
                      <FaMinus size={12} />
                    </button>
                    <span className="w-12 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.type, 1)}
                      className="p-2 rounded-3xl bg-chonky-khaki hover:bg-chonky-poop transition-colors text-chonky-white"
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency((item.price * item.quantity))}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id, item.type)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-3xl transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>

            {/* Mixed branches warning */}
            {hasMixedBranches() && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-3xl">
                <p className="text-red-800 font-semibold">⚠️ Mixed Branches Detected</p>
                <p className="text-red-600 text-sm mt-1">
                  You have items from multiple branches. Please remove items from one branch to proceed with checkout.
                  You can only order from one branch at a time.
                </p>
              </div>
            )}

            <button
              onClick={continueShopping}
              className="text-secondary hover:text-btn-yellow flex items-center gap-2 font-semibold transition-colors"
            >
              ← Continue Shopping
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-chonky-white rounded-3xl shadow-md p-6 sticky top-4">
            <h2 className="heading-section text-chonky-brown mb-4">Order Summary</h2>

            {/* Branch Selection */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-chonky-brown mb-2">
                Pick-up Branch *
              </label>
              <div className="px-4 py-3 border-2 border-chonky-khaki bg-accent-peach rounded-3xl">
                <p className="text-lg font-bold text-chonky-brown">{selectedBranch}</p>
                <p className="text-xs text-chonky-poop mt-1">
                  Based on items in your cart
                </p>
              </div>
              {hasMixedBranches() && (
                <p className="text-xs text-red-600 mt-2">
                  Remove items from one branch to proceed
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-chonky-brown mb-2">
                Order Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions?"
                rows="3"
                className="w-full px-4 py-2 border border-chonky-khaki rounded-3xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-chonky-khaki pt-4 mb-4">
              <div className="flex justify-between text-chonky-poop mb-2">
                <span>Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                <span>{formatCurrency(getTotalPrice())}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-chonky-brown mt-4">
                <span>Total</span>
                <span>{formatCurrency(getTotalPrice())}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={loading || !user || hasMixedBranches()}
              className={`w-full py-3 px-4 rounded-3xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                loading || !user || hasMixedBranches()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-secondary text-chonky-white hover:bg-btn-yellow hover:text-chonky-brown'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FaShoppingBag />
                  Place Order
                </>
              )}
            </button>

            {!user && (
              <p className="text-sm text-red-600 text-center mt-2">
                Please login to place an order
              </p>
            )}

            {hasMixedBranches() && (
              <p className="text-sm text-red-600 text-center mt-2">
                Cannot checkout with items from multiple branches
              </p>
            )}

            {/* Info */}
            <div className="mt-6 text-sm text-gray-500 space-y-2">
              <p>• Order will be prepared for pick-up at selected branch</p>
              <p>• You will be notified when order is ready</p>
              <p>• Payment upon pick-up</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
