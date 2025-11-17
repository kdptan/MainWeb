import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    verifyEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/verify-email/', {
        token: token
      });

      setStatus('success');
      setMessage(response.data.detail || 'Email verified successfully!');
      setUsername(response.data.username || '');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/signin');
      }, 3000);

    } catch (error) {
      setStatus('error');
      const errorMsg = error.response?.data?.error || 'Failed to verify email. The link may be invalid or expired.';
      setMessage(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-primary-darker flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="flex justify-center mb-4">
              <FaSpinner className="text-secondary text-6xl animate-spin" />
            </div>
            <h2 className="heading-card text-gray-900 mb-2">Verifying Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-4">
                <FaCheckCircle className="text-green-600 text-6xl" />
              </div>
            </div>
            <h2 className="heading-card text-green-700 mb-2">Email Verified!</h2>
            <p className="text-gray-700 mb-4">{message}</p>
            {username && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                <p className="text-sm text-green-800">
                  Welcome, <strong>{username}</strong>!
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600 mb-4">
              Redirecting to login page in 3 seconds...
            </p>
            <Link
              to="/signin"
              className="inline-block px-6 py-2 bg-secondary text-white rounded-md hover:bg-secondary-light transition-colors font-medium"
            >
              Go to Login Now
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-4">
                <FaTimesCircle className="text-red-600 text-6xl" />
              </div>
            </div>
            <h2 className="heading-card text-red-700 mb-2">Verification Failed</h2>
            <p className="text-gray-700 mb-4">{message}</p>
            <div className="space-y-2">
              <Link
                to="/signin"
                className="block px-6 py-2 bg-secondary text-white rounded-md hover:bg-secondary-light transition-colors font-medium"
              >
                Go to Login
              </Link>
              <Link
                to="/register"
                className="block px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Register New Account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
