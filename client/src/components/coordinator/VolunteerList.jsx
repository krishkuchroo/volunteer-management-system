import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getVolunteers } from '../../services/volunteerService';
import Pagination from '../common/Pagination';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { formatDate, bgCheckBadgeColor, capitalizeFirst } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';

export default function VolunteerList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debouncedSearch = useDebounce(search);
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['volunteers', page, debouncedSearch, status],
    queryFn: () => getVolunteers({
      page, limit: 10,
      search: debouncedSearch || undefined,
      status: status || undefined,
    }),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Volunteers</h2>

      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…" className="input-field w-auto text-sm" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="input-field w-auto text-sm">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="Failed to load volunteers." />}

      {data && (
        <>
          <div className="grid gap-3">
            {data.volunteers.map(v => (
              <div key={v.id} className="card flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/coordinator/volunteers/${v.id}`)}>
                <div>
                  <p className="font-medium">{v.first_name} {v.last_name}</p>
                  <p className="text-sm text-gray-500">{v.email}</p>
                  {v.skills?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{v.skills.join(', ')}</p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${bgCheckBadgeColor(v.background_check_status)}`}>
                    {capitalizeFirst(v.background_check_status?.replace('_', ' '))}
                  </span>
                  <p className="text-xs text-gray-500">{v.hours_logged}h logged</p>
                  <p className="text-xs text-gray-400">{formatDate(v.created_at)}</p>
                </div>
              </div>
            ))}
            {data.volunteers.length === 0 && (
              <p className="text-center text-gray-500 py-8">No volunteers found.</p>
            )}
          </div>
          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
