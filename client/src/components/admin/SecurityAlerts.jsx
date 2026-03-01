import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSecurityAlerts, resolveSecurityAlert } from '../../services/adminService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const ALERT_TYPE_LABELS = {
  BRUTE_FORCE: 'Brute Force',
  PRIVILEGE_ESCALATION: 'Privilege Escalation',
};

const ALERT_TYPE_COLORS = {
  BRUTE_FORCE: 'bg-red-100 text-red-800',
  PRIVILEGE_ESCALATION: 'bg-orange-100 text-orange-800',
};

export default function SecurityAlerts() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['security-alerts'],
    queryFn: () => getSecurityAlerts({ resolved: 'false' }),
    refetchInterval: 30000,
  });

  const resolveMutation = useMutation({
    mutationFn: resolveSecurityAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['security-alerts'] }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load security alerts" />;

  const alerts = data?.alerts || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Security Alerts</h2>
        {data?.unresolvedCount > 0 && (
          <span className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
            {data.unresolvedCount} unresolved
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="card text-center text-gray-500 py-10">
          No unresolved security alerts.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="card flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ALERT_TYPE_COLORS[alert.alert_type] || 'bg-gray-100 text-gray-800'}`}>
                    {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800 truncate">
                  Identifier: <span className="font-mono">{alert.identifier}</span>
                </p>
                {alert.details && (
                  <p className="text-xs text-gray-500 mt-1">
                    {Object.entries(alert.details)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </p>
                )}
              </div>
              <button
                onClick={() => resolveMutation.mutate(alert.id)}
                disabled={resolveMutation.isPending}
                className="btn-primary text-sm shrink-0"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
