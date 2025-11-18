import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import placeholder from '../assets/placeholder-avatar.svg';
import { FaPencilAlt } from 'react-icons/fa';

export default function UpdateProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ username: user?.username || '', email: user?.email || '', new_password: '', confirm_password: '' });
  const [file, setFile] = useState(null);
  const fileRef = useRef();
  const modalRef = useRef(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);

  // Scroll to modal when opened
  useEffect(() => {
    if (modalRef.current) {
      setTimeout(() => {
        modalRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, []);

  // Disable body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Format error messages into clean, formal text
  const formatErrorMessage = (err) => {
    if (!err) return '';
    
    if (err.errors && typeof err.errors === 'object') {
      // Handle nested error object like {"new_password":["Ensure this field has at least 8 characters."]}
      const messages = [];
      for (const [field, fieldErrors] of Object.entries(err.errors)) {
        if (Array.isArray(fieldErrors)) {
          fieldErrors.forEach(msg => {
            // Format field name (e.g., "new_password" -> "New Password")
            const fieldLabel = field
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            messages.push(`${fieldLabel}: ${msg}`);
          });
        } else {
          messages.push(`${field}: ${fieldErrors}`);
        }
      }
      return messages.join('\n');
    }
    
    return err.detail || 'Update failed';
  };

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function onFileChange(e) {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
  }

  async function onSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      // If user chose a file, send as multipart/form-data
      if (file) {
        const fd = new FormData();
        fd.append('username', form.username);
        fd.append('email', form.email);
        if (form.new_password) fd.append('new_password', form.new_password);
        if (form.confirm_password) fd.append('confirm_password', form.confirm_password);
        fd.append('profile_picture', file);
        await updateProfile(fd);
      } else {
        await updateProfile({ username: form.username, email: form.email, new_password: form.new_password, confirm_password: form.confirm_password });
      }
      onClose();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center pt-4 z-50">
      <div ref={modalRef} className="bg-white rounded-md p-6 w-full max-w-md max-h-[90vh] overflow-auto">
        <h3 className="text-lg font-medium mb-4">Update Profile</h3>
  {error && <div className="text-sm text-red-600 mb-2 break-words whitespace-pre-wrap max-w-full">{error}</div>}
        <form onSubmit={onSave} className="space-y-3">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-sm text-gray-700">Profile picture</label>
              <div className="mt-1">
                <img src={user?.profile_picture || placeholder} alt="avatar" className="w-16 h-16 rounded-full object-cover border" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-700">Change picture</label>
              <input ref={fileRef} onChange={onFileChange} type="file" accept="image/*" className="mt-1 block w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Username</label>
            <div className="relative">
              <input 
                name="username" 
                value={form.username} 
                onChange={onChange} 
                readOnly={!editingUsername}
                className={`mt-1 block w-full rounded-md border-gray-300 pr-10 ${!editingUsername ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              <button
                type="button"
                onClick={() => setEditingUsername(!editingUsername)}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-md transition-colors ${
                  editingUsername 
                    ? 'text-secondary hover:text-secondary-light bg-secondary/10' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title={editingUsername ? "Lock username" : "Edit username"}
              >
                <FaPencilAlt className="text-sm" />
              </button>
            </div>
            {editingUsername && (
              <p className="text-xs text-secondary mt-1">✏️ Username editing enabled</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <div className="relative">
              <input 
                name="email" 
                value={form.email} 
                onChange={onChange}
                readOnly={!editingEmail}
                className={`mt-1 block w-full rounded-md border-gray-300 pr-10 ${!editingEmail ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              <button
                type="button"
                onClick={() => setEditingEmail(!editingEmail)}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-md transition-colors ${
                  editingEmail 
                    ? 'text-secondary hover:text-secondary-light bg-secondary/10' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title={editingEmail ? "Lock email" : "Edit email"}
              >
                <FaPencilAlt className="text-sm" />
              </button>
            </div>
            {editingEmail && (
              <p className="text-xs text-secondary mt-1">✏️ Email editing enabled</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-700">New password</label>
            <input name="new_password" type="password" value={form.new_password} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Confirm new password</label>
            <input name="confirm_password" type="password" value={form.confirm_password} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-md border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded-md bg-indigo-600 text-white">{saving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
