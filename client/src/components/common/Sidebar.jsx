import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const links = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'User Management' },
    { to: '/admin/audit-logs', label: 'Audit Logs' },
    { to: '/admin/security-alerts', label: 'Security Alerts' },
  ],
  coordinator: [
    { to: '/coordinator/dashboard', label: 'Dashboard' },
    { to: '/coordinator/volunteers', label: 'Volunteers' },
    { to: '/coordinator/background-checks', label: 'Background Checks' },
  ],
  volunteer: [
    { to: '/volunteer/dashboard', label: 'Dashboard' },
    { to: '/volunteer/profile', label: 'My Profile' },
    { to: '/volunteer/hours', label: 'Log Hours' },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const navLinks = links[user.role] || [];

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 pt-6 hidden md:block">
      <nav className="flex flex-col gap-1 px-3">
        {navLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
