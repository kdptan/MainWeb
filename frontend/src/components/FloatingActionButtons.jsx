import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClipboardList, FaBox, FaStar, FaShoppingCart } from 'react-icons/fa';
import '../styles/FloatingActionButtons.css';

export default function FloatingActionButtons({ user, cart, pendingOrdersCount, myOrdersCount, feedbackCount, showCart = true }) {
  const navigate = useNavigate();

  const goToCart = () => {
    if (!user) {
      return;
    }
    navigate('/cart', { state: { cart } });
  };

  return (
    <div className="floating-action-buttons">
      {/* Admin Orders Button - Only for staff */}
      {user && user.is_staff && (
        <button
          onClick={() => navigate('/admin/orders')}
          className="fab fab-red"
          title="Admin: All Orders"
        >
          <FaClipboardList size={24} />
          {pendingOrdersCount > 0 && (
            <span className="fab-badge fab-badge-yellow">
              {pendingOrdersCount}
            </span>
          )}
          <span className="fab-tooltip">
            Admin: All Orders {pendingOrdersCount > 0 && `(${pendingOrdersCount} pending)`}
          </span>
        </button>
      )}

      {/* My Orders Button */}
      {user && (
        <button
          onClick={() => navigate('/my-orders')}
          className="fab fab-yellow"
          title="My Orders"
        >
          <FaBox size={24} />
          {myOrdersCount > 0 && (
            <span className="fab-badge fab-badge-green">
              {myOrdersCount}
            </span>
          )}
          <span className="fab-tooltip">
            My Orders ({myOrdersCount})
          </span>
        </button>
      )}

      {/* Feedback Button */}
      {user && (
        <button
          onClick={() => navigate('/feedback')}
          className="fab fab-purple"
          title="Give Feedback"
        >
          <FaStar size={24} />
          {feedbackCount > 0 && (
            <span className="fab-badge fab-badge-orange">
              {feedbackCount}
            </span>
          )}
          <span className="fab-tooltip">
            Give Feedback ({feedbackCount})
          </span>
        </button>
      )}

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
