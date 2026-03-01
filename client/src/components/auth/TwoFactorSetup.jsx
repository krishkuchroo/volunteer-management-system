import { useState, useEffect } from 'react';
import { setup2FA, enable2FA, disable2FA } from '../../services/authService';
import ErrorMessage from '../common/ErrorMessage';
import SuccessMessage from '../common/SuccessMessage';
import LoadingSpinner from '../common/LoadingSpinner';

export default function TwoFactorSetup({ twoFactorEnabled, onStatusChange }) {
  const [step, setStep] = useState('idle'); // idle | setup | confirm | done
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSetup() {
    setError('');
    setLoading(true);
    try {
      const data = await setup2FA();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('confirm');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set up 2FA');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnable(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await enable2FA(code);
      setSuccess('2FA enabled successfully!');
      setStep('done');
      onStatusChange?.(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await disable2FA(code);
      setSuccess('2FA disabled.');
      setStep('idle');
      setCode('');
      onStatusChange?.(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  // Disable flow
  if (twoFactorEnabled && step === 'idle') {
    return (
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Two-Factor Authentication</h3>
            <p className="text-sm text-green-600">Enabled</p>
          </div>
          <button onClick={() => setStep('disable')} className="text-sm text-red-600 hover:underline">
            Disable 2FA
          </button>
        </div>
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />
      </div>
    );
  }

  if (step === 'disable') {
    return (
      <div className="card space-y-4">
        <h3 className="font-semibold">Disable Two-Factor Authentication</h3>
        <ErrorMessage message={error} />
        <form onSubmit={handleDisable} className="space-y-3">
          <div>
            <label className="form-label">Enter 6-digit code to confirm</label>
            <input
              type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required className="input-field text-center tracking-widest" placeholder="000000"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={code.length !== 6} className="btn-primary">Disable</button>
            <button type="button" onClick={() => { setStep('idle'); setError(''); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  // Setup flow
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Two-Factor Authentication</h3>
      <p className="text-sm text-gray-500">Not enabled</p>
      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      {step === 'idle' && (
        <button onClick={handleSetup} className="btn-primary">Set Up 2FA</button>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Scan this QR code with Google Authenticator or Authy, then enter the 6-digit code to confirm.
          </p>
          {qrCode && (
            <div className="flex flex-col items-center gap-2">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 border rounded" />
              <details className="text-xs text-gray-400 cursor-pointer">
                <summary>Can't scan? Use manual key</summary>
                <code className="block mt-1 break-all bg-gray-50 p-2 rounded">{secret}</code>
              </details>
            </div>
          )}
          <form onSubmit={handleEnable} className="space-y-3">
            <div>
              <label className="form-label">Enter code from app</label>
              <input
                type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required autoFocus className="input-field text-center tracking-widest" placeholder="000000"
              />
            </div>
            <button type="submit" disabled={code.length !== 6} className="btn-primary w-full">
              Confirm & Enable
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
