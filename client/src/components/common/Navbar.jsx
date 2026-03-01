import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_ROUTES } from '../../utils/constants';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to={user ? ROLE_ROUTES[user.role] : '/'} className="text-xl font-bold tracking-tight">
          VolunteerMS
        </Link>

        {user && (
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden sm:block">
              {user.firstName} {user.lastName}
              <span className="ml-2 bg-blue-500 px-2 py-0.5 rounded text-xs capitalize">{user.role}</span>
            </span>
            <NotificationBell />
            <button onClick={logout} className="hover:underline">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
