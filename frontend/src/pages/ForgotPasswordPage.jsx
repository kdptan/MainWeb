import React from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-md p-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Reset password</h2>
        <p className="text-sm text-gray-600 mb-6">Enter your email and we'll send a link to reset your password.</p>

        <form className="space-y-4 text-left">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input id="email" name="email" type="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          <div>
            <button type="submit" className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Send reset link</button>
          </div>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          Remembered? <Link to="/signin" className="text-indigo-600 hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
