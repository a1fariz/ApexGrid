import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import api from '../services/api';
import f1Login from '../assets/f1_login.png';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function VerifyAccount() {
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
    <PageTransition>
      <div className="min-h-screen flex flex-col md:flex-row bg-f1-black text-f1-white">
        {/* Left Side: F1 Brand Visuals (60% width, hidden on mobile) */}
        <div className="hidden md:flex md:w-[60%] relative overflow-hidden items-center justify-center bg-black border-r border-f1-border">
          <img
            src={f1Login}
            alt="F1 Cockpit"
            className="absolute inset-0 w-full h-full object-cover opacity-60 select-none pointer-events-none"
          />
          {/* Telemetry Pattern */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay"
               style={{
                 backgroundImage: `radial-gradient(var(--f1-white) 1px, transparent 1px)`,
                 backgroundSize: '20px 20px'
               }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70" />
          <div className="relative z-10 text-center px-8">
            <div className="inline-flex items-center justify-center w-24 h-12 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl mb-5 shadow-xl">
              <svg viewBox="0 0 120 30" className="w-16 h-8 text-f1-red fill-current">
                <path d="M101.086812,30 L101.711812,30 L101.711812,27.106875 L101.722437,27.106875 L102.761812,30 L103.302437,30 L104.341812,27.106875 L104.352437,27.106875 L104.352437,30 L104.977437,30 L104.977437,26.25125 L104.063687,26.25125 L103.055562,29.18625 L103.044937,29.18625 L102.011187,26.25125 L101.086812,26.25125 L101.086812,30 Z M97.6274375,26.818125 L98.8136875,26.818125 L98.8136875,30 L99.4699375,30 L99.4699375,26.818125 L100.661812,26.818125 L100.661812,26.25125 L97.6274375,26.25125 L97.6274375,26.818125 Z M89.9999375,30 L119.999937,0 L101.943687,0 L71.9443125,30 L89.9999375,30 Z M85.6986875,13.065 L49.3818125,13.065 C38.3136875,13.065 36.3768125,13.651875 31.6361875,18.3925 C27.2024375,22.82625 20.0005625,30 20.0005625,30 L35.7324375,30 L39.4855625,26.246875 C41.9530625,23.779375 43.2255625,23.52375 48.4068125,23.52375 L75.2405625,23.52375 L85.6986875,13.065 Z M31.1518125,16.253125 C27.8774375,19.3425 20.7530625,26.263125 16.9130625,30 L-6.25e-05,30 C-6.25e-05,30 13.5524375,16.486875 21.0849375,9.0725 C28.8455625,1.685 32.7143125,0 46.9486875,0 L98.7643125,0 L87.5449375,11.21875 L48.0011875,11.21875 C37.9993125,11.21875 35.7518125,11.911875 31.1518125,16.253125 Z" />
              </svg>
            </div>
            <h1 className="font-f1 text-3xl font-black italic tracking-[0.12em] text-white mb-3">
              APEX<span className="text-f1-red font-light">GRID</span>
            </h1>
            <p className="text-gray-300 text-sm max-w-xs mx-auto leading-relaxed">
              Verify your email to complete registration. Your journey starts here.
            </p>
          </div>
        </div>

        {/* Right Side: Content Container */}
        <div className="w-full md:w-[40%] flex items-center justify-center px-6 py-12 relative bg-f1-black">
          <div className="absolute inset-0 opacity-[0.05] light:opacity-[0.02] pointer-events-none"
               style={{
                 backgroundImage: `radial-gradient(var(--f1-white) 1px, transparent 1px)`,
                 backgroundSize: '24px 24px'
               }}
          />

          <div className="w-full max-w-md relative z-10">
            {/* Mobile Branding (Visible on mobile, hidden on desktop) */}
            <div className="md:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-10 bg-f1-surface border border-f1-border rounded-xl mb-3">
                <svg viewBox="0 0 120 30" className="w-12 h-6 text-f1-red fill-current">
                  <path d="M101.086812,30 L101.711812,30 L101.711812,27.106875 L101.722437,27.106875 L102.761812,30 L103.302437,30 L104.341812,27.106875 L104.352437,27.106875 L104.352437,30 L104.977437,30 L104.977437,26.25125 L104.063687,26.25125 L103.055562,29.18625 L103.044937,29.18625 L102.011187,26.25125 L101.086812,26.25125 L101.086812,30 Z M97.6274375,26.818125 L98.8136875,26.818125 L98.8136875,30 L99.4699375,30 L99.4699375,26.818125 L100.661812,26.818125 L100.661812,26.25125 L97.6274375,26.25125 L97.6274375,26.818125 Z M89.9999375,30 L119.999937,0 L101.943687,0 L71.9443125,30 L89.9999375,30 Z M85.6986875,13.065 L49.3818125,13.065 C38.3136875,13.651875 36.3768125,13.651875 31.6361875,18.3925 C27.2024375,22.82625 20.0005625,30 20.0005625,30 L35.7324375,30 L39.4855625,26.246875 C41.9530625,23.779375 43.2255625,23.52375 48.4068125,23.52375 L75.2405625,23.52375 L85.6986875,13.065 Z M31.1518125,16.253125 C27.8774375,19.3425 20.7530625,26.263125 16.9130625,30 L-6.25e-05,30 C-6.25e-05,30 13.5524375,16.486875 21.0849375,9.0725 C28.8455625,1.685 32.7143125,0 46.9486875,0 L98.7643125,0 L87.5449375,11.21875 L48.0011875,11.21875 C37.9993125,11.21875 35.7518125,11.911875 31.1518125,16.253125 Z" />
                </svg>
              </div>
              <h1 className="font-f1 text-2xl font-black italic tracking-[0.12em] text-f1-white">
                APEX<span className="text-f1-red font-light">GRID</span>
              </h1>
              <p className="text-xs text-f1-light mt-1">Formula 1 Race Ticket Platform</p>
            </div>

            {/* Desktop Brand Subtitle */}
            <div className="hidden md:block mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="f1-stripe" />
                <span className="label-machined text-f1-light">Verification</span>
              </div>
              <h2 className="font-f1 text-2xl font-semibold text-f1-white tracking-tight animate-fade-in">
                Verify Your Email
              </h2>
              <p className="text-f1-light text-sm mt-1 animate-fade-in" style={{ animationDelay: '0.05s' }}>
                Confirming your account...
              </p>
            </div>

            <div className="card p-8 shadow-xl border border-f1-border bg-f1-card animate-scale-in">
              {/* Verifying state */}
              {status === 'verifying' && (
                <div className="py-8 text-center">
                  <div
                    className="w-16 h-16 rounded-full animate-spin mx-auto mb-6 border-4"
                    style={{ borderColor: 'var(--f1-border)', borderTopColor: 'var(--f1-red)' }}
                  />
                  <h3 className="text-xl font-bold mb-2 text-f1-white">
                    Verifying Email
                  </h3>
                  <p className="text-f1-light">
                    Please wait while we verify your account...
                  </p>
                </div>
              )}

              {/* Success state */}
              {status === 'success' && (
                <div className="py-6 text-center animate-fade-in">
                  <div className="w-16 h-16 bg-f1-green/20 text-f1-green rounded-full flex items-center justify-center mx-auto mb-5 border border-f1-green/40 text-2xl">
                    <FaCheckCircle />
                  </div>
                  <div className="f1-stripe mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-f1-white">
                    Verified!
                  </h3>
                  <p className="mb-6 text-f1-body" style={{ color: 'var(--f1-body)' }}>
                    {message}
                  </p>
                  <p className="text-sm text-f1-light mb-4">
                    Redirecting to login in a few seconds...
                  </p>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--f1-border)' }}>
                    <div
                      className="h-full bg-f1-green rounded-full"
                      style={{ animation: 'progressShrink 3s linear forwards', width: '100%' }}
                    />
                  </div>
                </div>
              )}

              {/* Error state */}
              {status === 'error' && (
                <div className="py-6 text-center animate-fade-in">
                  <div className="w-16 h-16 bg-f1-red/20 text-f1-red rounded-full flex items-center justify-center mx-auto mb-5 border border-f1-red/40 text-2xl">
                    <FaTimesCircle />
                  </div>
                  <div className="f1-stripe mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-f1-white">
                    Verification Failed
                  </h3>
                  <p className="mb-6 text-f1-light">
                    {message}
                  </p>
                  <Link
                    to="/login"
                    className="btn-primary inline-flex items-center justify-center w-full text-center rounded-lg"
                  >
                    Back to Login
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-8 text-center text-xs text-gray-500">
              © 2026 ApexGrid — Ultimate Motorsport Experience
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
