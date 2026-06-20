import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Token is missing.');
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const verifyEmail = async () => {
      try {
        const response = await api.get(`/auth/verify?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully! You can now log in.');
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: 'var(--f1-black)' }}>
      {/* Background accent glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-f1-red opacity-10 blur-[100px] rounded-full pointer-events-none" />

      <div
        className="w-full max-w-md p-8 rounded-2xl shadow-2xl z-10 text-center border"
        style={{
          background: 'var(--f1-card)',
          borderColor: 'var(--f1-border)',
          color: 'var(--f1-white)',
        }}
      >
        {/* Logo */}
        <h2 className="text-3xl font-black italic tracking-wider mb-6">
          <span style={{ color: 'var(--f1-white)' }}>APEX</span>
          <span className="text-f1-red">GRID</span>
        </h2>

        {/* Verifying state */}
        {status === 'verifying' && (
          <div className="py-8">
            <div
              className="w-16 h-16 rounded-full animate-spin mx-auto mb-4 border-4"
              style={{ borderColor: 'var(--f1-border)', borderTopColor: 'var(--f1-red)' }}
            />
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--f1-white)' }}>
              Verifying Email
            </h3>
            <p style={{ color: 'var(--f1-light)' }}>
              Please wait while we verify your account...
            </p>
          </div>
        )}

        {/* Success state */}
        {status === 'success' && (
          <div className="py-8 animate-fade-in">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/40">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--f1-white)' }}>
              ✅ Verified!
            </h3>
            <p className="mb-4" style={{ color: 'var(--f1-white)', opacity: 0.8 }}>
              {message}
            </p>
            <p className="text-sm" style={{ color: 'var(--f1-light)' }}>
              Redirecting to login in a few seconds...
            </p>
            <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: 'var(--f1-border)' }}>
              <div
                className="h-1 bg-green-500 rounded-full"
                style={{ animation: 'progressShrink 3s linear forwards', width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="py-8 animate-fade-in">
            <div className="w-16 h-16 bg-red-500/20 text-f1-red rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/40">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--f1-white)' }}>
              ❌ Verification Failed
            </h3>
            <p className="mb-6" style={{ color: 'var(--f1-light)' }}>
              {message}
            </p>
            <Link
              to="/login"
              className="btn-primary inline-block w-full text-center"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyAccount;
