import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '../components/common/Sidebar';
import ProfilePage from '../components/volunteer/ProfilePage';
import HoursLogging from '../components/volunteer/HoursLogging';
import { getMyVolunteerProfile } from '../services/volunteerService';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { bgCheckBadgeColor, capitalizeFirst, formatHours } from '../utils/formatters';

function DashboardHome() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-volunteer-profile'],
    queryFn: getMyVolunteerProfile,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome, {user?.firstName}!</h1>

      {isLoading && <LoadingSpinner />}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 text-blue-700 rounded-lg p-4">
            <p className="text-sm opacity-80">Total Hours</p>
            <p className="text-3xl font-bold mt-1">{formatHours(profile.hours_logged)}h</p>
          </div>
          <div className={`rounded-lg p-4 ${bgCheckBadgeColor(profile.background_check_status)}`}>
            <p className="text-sm opacity-80">Background Check</p>
            <p className="text-xl font-bold mt-1 capitalize">
              {capitalizeFirst(profile.background_check_status?.replace('_', ' '))}
            </p>
          </div>
          {profile.skills?.length > 0 && (
            <div className="bg-gray-50 text-gray-700 rounded-lg p-4 col-span-2 md:col-span-1">
              <p className="text-sm opacity-80">Skills</p>
              <p className="text-sm font-medium mt-1">{profile.skills.join(', ')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VolunteerDashboard() {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="hours" element={<HoursLogging />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
