import { useAuth } from './useAuth';

export function useRoleAccess() {
  const { user } = useAuth();

  return {
    canManageUsers: user?.role === 'admin',
    canViewAuditLogs: user?.role === 'admin',
    canViewStatistics: user?.role === 'admin',
    canManageVolunteers: ['admin', 'coordinator'].includes(user?.role),
    canReviewBackgroundChecks: ['admin', 'coordinator'].includes(user?.role),
    canApproveHours: ['admin', 'coordinator'].includes(user?.role),
    isOwnProfile: (userId) => user?.id === userId,
  };
}
