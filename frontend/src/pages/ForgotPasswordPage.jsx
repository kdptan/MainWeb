import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import axios from 'axios';
import { FaUser, FaCheckCircle } from 'react-icons/fa';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.showToast('Please enter your email', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/password-reset/', {
        email: email
      });

      toast.showToast(response.data.detail || 'Password reset email sent!', 'success');
      setSubmitted(true);
      
      // Store user data for display
      if (response.data.username) {
        setUsername(response.data.username);
      }
      if (response.data.profile_picture) {
        setProfilePicture(response.data.profile_picture);
      }
      if (response.data.first_name) {
        setFirstName(response.data.first_name);
      }
      if (response.data.last_name) {
        setLastName(response.data.last_name);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to send reset email. Please try again.';
      toast.showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast />
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white shadow-md rounded-md p-8 text-center">
          <h2 className="heading-main text-gray-900 mb-4">Reset password</h2>
          
          {!submitted ? (
            <>
              <p className="text-sm text-gray-600 mb-6">
                Enter your email and we'll send a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-secondary focus:border-secondary px-3 py-2 border"
                    placeholder="your.email@example.com"
                    disabled={loading}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-secondary-light disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              {/* Success Icon */}
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <FaCheckCircle className="text-green-600 text-4xl" />
                </div>
              </div>
              
              <p className="text-lg font-semibold text-gray-900 mb-4">
                Password Reset Link Sent!
              </p>
              
              {/* User Profile Card */}
              <div className="bg-gradient-to-br from-secondary/10 to-accent-cream/30 border-2 border-secondary/20 rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt={username}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center border-4 border-white shadow-md">
                        <FaUser className="text-secondary text-3xl" />
                      </div>
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 text-left">
                    <p className="text-xs text-gray-600 uppercase tracking-wide font-medium mb-1">
                      Account Found
                    </p>
                    {(firstName || lastName) && (
                      <p className="text-xl font-bold text-gray-900 mb-1">
                        {firstName} {lastName}
                      </p>
                    )}
                    <p className="text-sm text-gray-700 font-medium">
                      @{username}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Email Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-900 mb-1">
                  📧 Check your email inbox
                </p>
                <p className="text-xs text-blue-800">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  ⏱️ The link will expire in 24 hours
                </p>
              </div>
              
              <p className="text-xs text-gray-500">
                Didn't receive the email? Check your spam folder or try submitting again.
              </p>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            Remembered? <Link to="/signin" className="text-secondary hover:underline font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </>
  );
}
