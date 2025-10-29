import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import placeholder from '../assets/placeholder-avatar.svg';

export default function UpdateProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ username: user?.username || '', email: user?.email || '', new_password: '', confirm_password: '' });
  const [file, setFile] = useState(null);
  const fileRef = useRef();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
      setError((err && err.errors) ? JSON.stringify(err.errors) : (err.detail || 'Update failed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-md max-h-[90vh] overflow-auto">
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
            <label className="block text-sm text-gray-700">Username</label>
            <input name="username" value={form.username} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300 break-words" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Email</label>
            <input name="email" value={form.email} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300 break-words" />
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
