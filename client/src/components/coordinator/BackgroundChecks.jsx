import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBackgroundChecks, updateBackgroundCheckStatus } from '../../services/coordinatorService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { formatDate, capitalizeFirst } from '../../utils/formatters';

export default function BackgroundChecks() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [notes, setNotes] = useState({});
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['background-checks', statusFilter],
    queryFn: () => getBackgroundChecks({ status: statusFilter }),
  });

  async function handleUpdate(volunteerId, status) {
    try {
      await updateBackgroundCheckStatus(volunteerId, { status, notes: notes[volunteerId] || '' });
      queryClient.invalidateQueries(['background-checks']);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Background Checks</h2>

      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
        className="input-field w-auto text-sm">
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="Failed to load background checks." />}

      {data && (
        <div className="space-y-3">
          {data.map(item => (
            <div key={item.volunteer_id} className="card space-y-3">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{item.first_name} {item.last_name}</p>
                  <p className="text-sm text-gray-500">{item.email}</p>
                  <p className="text-xs text-gray-400">Submitted {formatDate(item.submitted_at)}</p>
                </div>
                <span className="text-sm font-medium capitalize">{capitalizeFirst(item.status.replace('_', ' '))}</span>
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={notes[item.volunteer_id] || ''}
                  onChange={e => setNotes({ ...notes, [item.volunteer_id]: e.target.value })}
                  className="input-field text-sm" rows={2}
                  placeholder="Optional notes…"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleUpdate(item.volunteer_id, 'in_progress')}
                  className="btn-secondary text-sm">Mark In Progress</button>
                <button onClick={() => handleUpdate(item.volunteer_id, 'approved')}
                  className="btn-primary text-sm">Approve</button>
                <button onClick={() => handleUpdate(item.volunteer_id, 'rejected')}
                  className="btn-danger text-sm">Reject</button>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-center text-gray-500 py-8">No background checks with status "{statusFilter}".</p>
          )}
        </div>
      )}
    </div>
  );
}
