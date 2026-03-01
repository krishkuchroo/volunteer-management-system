import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { verify2FA } from '../../services/authService';
import ErrorMessage from '../common/ErrorMessage';
import { ROLE_ROUTES } from '../../utils/constants';

export default function TwoFactorVerify({ tempToken, onCancel }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await verify2FA(tempToken, code);
      login(data.user, data.token);
      navigate(ROLE_ROUTES[data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-500">Enter the 6-digit code from your authenticator app.</p>
      </div>

      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Authentication Code</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
            autoFocus
            className="input-field text-center text-2xl tracking-widest"
            placeholder="000000"
          />
        </div>

        <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full">
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>

      <button onClick={onCancel} className="w-full text-sm text-gray-500 hover:text-gray-700">
        Back to login
      </button>
    </div>
  );
}
