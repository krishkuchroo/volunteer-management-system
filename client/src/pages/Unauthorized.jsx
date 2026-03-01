import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_ROUTES } from '../utils/constants';

export default function Unauthorized() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-red-600">403</h1>
        <p className="text-gray-600">You don't have permission to access that page.</p>
        <Link to={user ? ROLE_ROUTES[user.role] : '/login'} className="btn-primary inline-block">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
