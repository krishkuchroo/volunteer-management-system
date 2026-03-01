import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyVolunteerProfile, updateVolunteerProfile } from '../../services/volunteerService';
import { updateProfile } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import SuccessMessage from '../common/SuccessMessage';
import { bgCheckBadgeColor, capitalizeFirst } from '../../utils/formatters';

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-volunteer-profile'],
    queryFn: getMyVolunteerProfile,
  });

  const [form, setForm] = useState(null);

  if (!form && profile) {
    setForm({
      firstName: user.firstName, lastName: user.lastName, phone: user.phone || '',
      address: profile.address || '', emergencyContact: profile.emergencyContact || '',
      skills: profile.skills?.join(', ') || '', availability: profile.availability || '',
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);
    try {
      await Promise.all([
        updateProfile({ firstName: form.firstName, lastName: form.lastName, phone: form.phone }),
        updateVolunteerProfile(profile.id, {
          address: form.address,
          emergencyContact: form.emergencyContact,
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
          availability: form.availability,
        }),
      ]);
      setSuccess('Profile updated successfully.');
      queryClient.invalidateQueries(['my-volunteer-profile']);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <LoadingSpinner />;
  if (!form) return null;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-semibold">My Profile</h2>
        {profile && (
          <span className={`text-xs px-3 py-1 rounded-full ${bgCheckBadgeColor(profile.background_check_status)}`}>
            BG Check: {capitalizeFirst(profile.background_check_status?.replace('_', ' '))}
          </span>
        )}
      </div>

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">First Name</label>
            <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
              required className="input-field" />
          </div>
          <div>
            <label className="form-label">Last Name</label>
            <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
              required className="input-field" />
          </div>
        </div>

        <div>
          <label className="form-label">Phone</label>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
            className="input-field" placeholder="+1234567890" />
        </div>

        <div>
          <label className="form-label">Address</label>
          <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
            className="input-field" placeholder="123 Main St, City, State 12345" />
          <p className="text-xs text-gray-400 mt-1">Stored encrypted</p>
        </div>

        <div>
          <label className="form-label">Emergency Contact</label>
          <input value={form.emergencyContact}
            onChange={e => setForm({ ...form, emergencyContact: e.target.value })}
            className="input-field" placeholder="Name - Phone number" />
          <p className="text-xs text-gray-400 mt-1">Stored encrypted</p>
        </div>

        <div>
          <label className="form-label">Skills (comma-separated)</label>
          <input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })}
            className="input-field" placeholder="First Aid, Teaching, Cooking" />
        </div>

        <div>
          <label className="form-label">Availability</label>
          <input value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })}
            className="input-field" placeholder="Weekends, Monday evenings…" />
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
