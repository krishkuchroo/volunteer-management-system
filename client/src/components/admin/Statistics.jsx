import { useQuery } from '@tanstack/react-query';
import { getStatistics } from '../../services/adminService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { formatHours } from '../../utils/formatters';

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-lg p-4 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

export default function Statistics() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['statistics'],
    queryFn: getStatistics,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load statistics" />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <StatCard label="Total Users" value={stats.totalUsers} />
      <StatCard label="Volunteers" value={stats.totalVolunteers} color="green" />
      <StatCard label="Coordinators" value={stats.totalCoordinators} color="blue" />
      <StatCard label="Admins" value={stats.totalAdmins} color="yellow" />
      <StatCard label="Pending BG Checks" value={stats.pendingBackgroundChecks} color="yellow" />
      <StatCard label="Approved BG Checks" value={stats.approvedBackgroundChecks} color="green" />
      <StatCard label="Total Hours" value={formatHours(stats.totalHoursLogged)} color="blue" />
      <StatCard label="Hours This Month" value={formatHours(stats.hoursThisMonth)} color="green" />
    </div>
  );
}
