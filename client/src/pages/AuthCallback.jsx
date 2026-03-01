import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getCurrentUser } from '../services/authService';
import { ROLE_ROUTES } from '../utils/constants';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    // Store token first so getCurrentUser can use it
    localStorage.setItem('token', token);

    getCurrentUser()
      .then((user) => {
        login(user, token);
        navigate(ROLE_ROUTES[user.role] || '/', { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login?error=oauth_failed', { replace: true });
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Signing you in…</p>
    </div>
  );
}
