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
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-f1-black px-4 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-f1-red opacity-10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#15151E] p-8 rounded-2xl border border-gray-800 shadow-2xl z-10 text-center">
        <h2 className="text-3xl font-black italic tracking-wider mb-6">
          <span className="text-white">APEX</span>
          <span className="text-f1-red">GRID</span>
        </h2>
        
        {status === 'verifying' && (
          <div className="py-8">
            <div className="w-16 h-16 border-4 border-gray-700 border-t-f1-red rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-white mb-2">Verifying Email</h3>
            <p className="text-gray-400">Please wait while we verify your account...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8 animate-fade-in">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Verified!</h3>
            <p className="text-gray-300 mb-6">{message}</p>
            <p className="text-gray-500 text-sm">Redirecting to login in a few seconds...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8 animate-fade-in">
            <div className="w-16 h-16 bg-red-500/20 text-f1-red rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Verification Failed</h3>
            <p className="text-gray-300 mb-8">{message}</p>
            <Link to="/login" className="bg-f1-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-block w-full">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyAccount;
