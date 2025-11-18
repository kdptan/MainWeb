import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import '../styles/FloatingActionButtons.css';

export default function FloatingActionButtons({ user, cart, showCart = true }) {
  const navigate = useNavigate();

  const goToCart = () => {
    if (!user) {
      return;
    }
    navigate('/cart', { state: { cart } });
  };

  return (
    <div className="floating-action-buttons">
      {/* Cart Button - Conditional visibility */}
      {showCart && (
        <button
          onClick={goToCart}
          className="fab fab-blue"
          title={user ? 'View Cart' : 'Login to view cart'}
        >
          <FaShoppingCart size={24} />
          {user && cart.length > 0 && (
            <span className="fab-badge fab-badge-red">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
          {!user && (
            <span className="fab-tooltip">
              Login Required
            </span>
          )}
        </button>
      )}
    </div>
  );
}
