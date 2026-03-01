import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVolunteers } from '../../services/volunteerService';
import { approveHours, getHours } from '../../services/volunteerService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { formatDate } from '../../utils/formatters';

function VolunteerHoursRow({ volunteer }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['hours', volunteer.id],
    queryFn: () => getHours(volunteer.id),
  });

  const pendingEntries = data?.entries?.filter(e => !e.approved_by) || [];
  if (!isLoading && pendingEntries.length === 0) return null;

  async function handleApprove(hoursId) {
    try {
      await approveHours(hoursId);
      queryClient.invalidateQueries(['hours', volunteer.id]);
    } catch {
      alert('Failed to approve hours.');
    }
  }

  return (
    <div className="card space-y-2">
      <p className="font-medium">{volunteer.first_name} {volunteer.last_name}</p>
      {isLoading ? <LoadingSpinner size="sm" /> : pendingEntries.map(entry => (
        <div key={entry.id} className="flex justify-between items-center bg-gray-50 rounded p-2 text-sm">
          <div>
            <span className="font-medium">{entry.hours}h</span>
            <span className="text-gray-500 ml-2">{formatDate(entry.date)}</span>
            {entry.description && <p className="text-gray-500 text-xs">{entry.description}</p>}
          </div>
          <button onClick={() => handleApprove(entry.id)} className="btn-primary text-xs px-2 py-1">
            Approve
          </button>
        </div>
      ))}
    </div>
  );
}

export default function ApproveHours() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['volunteers-for-hours'],
    queryFn: () => getVolunteers({ limit: 50 }),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Approve Volunteer Hours</h2>
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="Failed to load volunteers." />}
      {data?.volunteers.map(v => <VolunteerHoursRow key={v.id} volunteer={v} />)}
    </div>
  );
}
