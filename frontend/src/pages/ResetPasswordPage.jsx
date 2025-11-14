import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ResetPasswordPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.showToast('Please fill in all fields', 'error');
      return;
    }

    if (newPassword.length < 8) {
      toast.showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/password-reset-confirm/', {
        uid: uid,
        token: token,
        new_password: newPassword
      });

      toast.showToast(response.data.detail || 'Password reset successfully!', 'success');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to reset password. The link may be invalid or expired.';
      toast.showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast />
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white shadow-md rounded-md p-8">
          <h2 className="heading-main text-gray-900 mb-4 text-center">Set New Password</h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-secondary focus:border-secondary px-3 py-2 border pr-10"
                  placeholder="Enter new password"
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-secondary focus:border-secondary px-3 py-2 border pr-10"
                  placeholder="Confirm new password"
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-600">Passwords do not match</p>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || newPassword !== confirmPassword}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-secondary-light disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-sm text-gray-600 text-center">
            <Link to="/signin" className="text-secondary hover:underline font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
