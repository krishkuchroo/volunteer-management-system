import { useState } from 'react';
import { createUser } from '../../services/adminService';
import ErrorMessage from '../common/ErrorMessage';
import SuccessMessage from '../common/SuccessMessage';

export default function CreateUser({ onCreated }) {
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    role: 'volunteer', isVerified: true, phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await createUser(form);
      setSuccess('User created successfully.');
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'volunteer', isVerified: true, phone: '' });
      onCreated?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">First Name</label>
          <input name="firstName" value={form.firstName} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label className="form-label">Last Name</label>
          <input name="lastName" value={form.lastName} onChange={handleChange} required className="input-field" />
        </div>
      </div>

      <div>
        <label className="form-label">Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required className="input-field" />
      </div>

      <div>
        <label className="form-label">Temporary Password</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} required className="input-field" />
      </div>

      <div>
        <label className="form-label">Role</label>
        <select name="role" value={form.role} onChange={handleChange} className="input-field">
          <option value="volunteer">Volunteer</option>
          <option value="coordinator">Coordinator</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="isVerified" name="isVerified" checked={form.isVerified} onChange={handleChange} />
        <label htmlFor="isVerified" className="text-sm text-gray-700">Mark as verified</label>
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Creating…' : 'Create User'}
      </button>
    </form>
  );
}
