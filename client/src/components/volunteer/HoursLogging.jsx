import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyVolunteerProfile, logHours, getHours } from '../../services/volunteerService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import SuccessMessage from '../common/SuccessMessage';
import { formatDate } from '../../utils/formatters';

export default function HoursLogging() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ date: '', hours: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['my-volunteer-profile'],
    queryFn: getMyVolunteerProfile,
  });

  const { data: hoursData, isLoading: hoursLoading } = useQuery({
    queryKey: ['my-hours', profile?.id],
    queryFn: () => getHours(profile.id),
    enabled: !!profile?.id,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);
    try {
      await logHours(profile.id, { ...form, hours: parseFloat(form.hours) });
      setSuccess('Hours logged successfully.');
      setForm({ date: '', hours: '', description: '' });
      queryClient.invalidateQueries(['my-hours', profile.id]);
      queryClient.invalidateQueries(['my-volunteer-profile']);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log hours.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Log Volunteer Hours</h2>

      <div className="card space-y-4">
        <h3 className="font-medium">Add Hours</h3>
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                required className="input-field" max={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="form-label">Hours</label>
              <input type="number" value={form.hours} step="0.5" min="0.5" max="24"
                onChange={e => setForm({ ...form, hours: e.target.value })}
                required className="input-field" placeholder="e.g. 3.5" />
            </div>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-field" rows={2} placeholder="What did you do?" />
          </div>
          <button type="submit" disabled={saving || !profile} className="btn-primary">
            {saving ? 'Saving…' : 'Log Hours'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="font-medium mb-4">
          Hours History
          {hoursData && <span className="ml-2 text-gray-500 text-sm">({hoursData.totalHours}h total)</span>}
        </h3>
        {hoursLoading && <LoadingSpinner size="sm" />}
        {hoursData?.entries?.length === 0 && (
          <p className="text-gray-500 text-sm">No hours logged yet.</p>
        )}
        <div className="space-y-2">
          {hoursData?.entries?.map(entry => (
            <div key={entry.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <div>
                <span className="font-medium">{entry.hours}h</span>
                <span className="text-gray-500 ml-2 text-sm">{formatDate(entry.date)}</span>
                {entry.description && <p className="text-gray-500 text-xs">{entry.description}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${entry.approved_by ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {entry.approved_by ? 'Approved' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
