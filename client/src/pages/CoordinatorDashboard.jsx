import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '../components/common/Sidebar';
import VolunteerList from '../components/coordinator/VolunteerList';
import BackgroundChecks from '../components/coordinator/BackgroundChecks';
import ApproveHours from '../components/coordinator/ApproveHours';
import { getStatistics } from '../services/adminService';
import LoadingSpinner from '../components/common/LoadingSpinner';

function DashboardHome() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: getStatistics,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Coordinator Dashboard</h1>
      {isLoading ? <LoadingSpinner /> : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Volunteers', value: stats.totalVolunteers },
            { label: 'Pending BG Checks', value: stats.pendingBackgroundChecks, highlight: true },
            { label: 'Approved BG Checks', value: stats.approvedBackgroundChecks },
            { label: 'Total Hours', value: stats.totalHoursLogged.toFixed(1) + 'h' },
          ].map(({ label, value, highlight }) => (
            <div key={label} className={`rounded-lg p-4 ${highlight ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
              <p className="text-sm opacity-80">{label}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoordinatorDashboard() {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="volunteers" element={<VolunteerList />} />
          <Route path="background-checks" element={<BackgroundChecks />} />
          <Route path="approve-hours" element={<ApproveHours />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
