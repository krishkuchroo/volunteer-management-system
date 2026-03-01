import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../../services/adminService';
import Pagination from '../common/Pagination';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { formatDateTime } from '../../utils/formatters';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ action: '', startDate: '', endDate: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: () => getAuditLogs({
      page, limit: 20,
      action: filters.action || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    }),
  });

  function handleFilter(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Audit Logs</h2>

      <div className="flex flex-wrap gap-3">
        <input name="action" value={filters.action} onChange={handleFilter}
          placeholder="Filter by action…" className="input-field w-auto text-sm" />
        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilter}
          className="input-field w-auto text-sm" />
        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilter}
          className="input-field w-auto text-sm" />
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="Failed to load logs." />}

      {data && (
        <>
          <div className="card p-0 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Resource</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    <td className="px-4 py-2">{log.user_name || <span className="text-gray-400 italic">System</span>}</td>
                    <td className="px-4 py-2 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-2 text-gray-600">{log.resource || '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
