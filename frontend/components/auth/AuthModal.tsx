'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from './AuthContext';

type AuthMode = 'login' | 'register';
type LoginStep = 'credentials' | 'otp';

interface AuthModalProps {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
}

const AuthModal = ({ open, mode, onClose, onSwitchMode }: AuthModalProps) => {
  const { login, verifyOtp, register, error: authError, setAuthError } = useAuth();

  const [loginMobile, setLoginMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null
  );
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');
  const [submitting, setSubmitting] = useState(false);

  const resetLoginState = useCallback(() => {
    setLoginMobile('');
    setLoginPassword('');
    setOtp('');
    setReferenceNo('');
    setRemainingAttempts(null);
    setLoginStep('credentials');
  }, []);

  const resetRegisterState = useCallback(() => {
    setRegisterEmail('');
    setRegisterPassword('');
  }, []);

  const previousOpenRef = useRef(false);

  useEffect(() => {
    if (open && !previousOpenRef.current) {
      resetLoginState();
      resetRegisterState();
      setAuthError(null);
    }
    previousOpenRef.current = open;
  }, [open, resetLoginState, resetRegisterState, setAuthError]);

  const previousModeRef = useRef<AuthMode>(mode);

  useEffect(() => {
    if (!open) {
      previousModeRef.current = mode;
      return;
    }

    if (previousModeRef.current !== mode) {
      if (mode === 'login') {
        resetLoginState();
      } else {
        resetRegisterState();
      }
      setAuthError(null);
      previousModeRef.current = mode;
    }
  }, [mode, open, resetLoginState, resetRegisterState, setAuthError]);

  if (!open) {
    return null;
  }

  const handleLoginSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setAuthError(null);

    try {
      if (loginStep === 'credentials') {
        const response = await login(loginMobile, loginPassword);

        if (response.mode === 'login') {
          onClose();
          return;
        }

        if (response.mode === 'otp') {
          const ref = response.reference_no ?? response.referenceNo ?? '';
          setReferenceNo(ref);
          setRemainingAttempts(
            response.remaining_attempts ?? response.remainingAttempts ?? null
          );
          setLoginStep('otp');
          return;
        }

        if (response.message) {
          setAuthError(response.message);
        } else {
          setAuthError('Unexpected response. Please try again.');
        }
      } else {
        if (!referenceNo) {
          setAuthError('Verification reference is missing. Please restart login.');
          setLoginStep('credentials');
          return;
        }

        await verifyOtp(loginMobile, loginPassword, referenceNo, otp);
        onClose();
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setAuthError(null);

    try {
      await register(registerEmail, registerPassword);
      onClose();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const googleAuthUrl = `/oauth/google`;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.4s ease-out;
        }

        .animate-slide-down {
          animation: slideDown 0.4s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }

        .modal-backdrop {
          animation: fadeIn 0.3s ease-out;
        }

        .modal-content {
          animation: slideUp 0.5s ease-out;
        }

        input {
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        button {
          transition: box-shadow 0.3s ease, background-color 0.3s ease;
        }

        button:hover:not(:disabled) {
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
        }

        button:active:not(:disabled) {
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.1);
        }
      `}</style>

      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm modal-backdrop">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl modal-content max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 bg-white">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 pr-2">
              {mode === 'login' ? 'Sign in with your mobile number' : 'Create your SoulFun account'}
            </h2>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 transition duration-200 hover:text-gray-600 hover:rotate-90"
            >
              ✕
            </button>
          </div>

          {authError && (
            <div className="mx-4 sm:mx-6 mt-4 animate-shake rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
              {authError}
            </div>
          )}

          {mode === 'login' ? (
            <form className="space-y-4 px-4 sm:px-6 py-4 sm:py-6" onSubmit={handleLoginSubmit}>
              {loginStep === 'credentials' ? (
                <>
                  <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0s' }}>
                    <label className="text-sm font-medium text-gray-700" htmlFor="auth-mobile">
                      Mobile Number
                    </label>
                    <input
                      id="auth-mobile"
                      type="tel"
                      value={loginMobile}
                      onChange={(event) => setLoginMobile(event.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      placeholder="Enter your mobile"
                      autoComplete="tel"
                    />
                  </div>

                  <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <label className="text-sm font-medium text-gray-700" htmlFor="auth-password">
                      Password
                    </label>
                    <input
                      id="auth-password"
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      placeholder="Enter password"
                      autoComplete="current-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full animate-slide-up rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 font-semibold text-white shadow-md transition hover:shadow-lg hover:from-blue-700 hover:to-blue-600 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-300 disabled:shadow-none"
                    style={{ animationDelay: '0.2s' }}
                  >
                    {submitting ? 'Signing in…' : 'Sign In'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 animate-slide-down">
                    We sent a verification code to <span className="font-semibold">{loginMobile}</span>. Enter the code to finish setting up your account.
                  </p>
                  {remainingAttempts !== null && (
                    <p className="text-xs text-gray-500 animate-slide-down" style={{ animationDelay: '0.1s' }}>Attempts remaining: {remainingAttempts}</p>
                  )}

                  <input
                    type="text"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    required
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full animate-slide-down rounded-lg border border-gray-200 px-4 py-2 text-center text-2xl font-semibold tracking-widest text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="000000"
                    style={{ animationDelay: '0.2s' }}
                  />

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full animate-slide-down rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 font-semibold text-white shadow-md transition hover:shadow-lg hover:from-blue-700 hover:to-blue-600 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-300 disabled:shadow-none"
                    style={{ animationDelay: '0.3s' }}
                  >
                    {submitting ? 'Verifying…' : 'Verify & Continue'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('credentials');
                      setOtp('');
                      setReferenceNo('');
                      setRemainingAttempts(null);
                      setAuthError(null);
                    }}
                    className="w-full animate-slide-down text-sm font-semibold text-blue-600 transition hover:underline hover:text-blue-700"
                    style={{ animationDelay: '0.4s' }}
                  >
                    Back to mobile login
                  </button>
                </>
              )}
            </form>
          ) : (
            <form className="space-y-4 px-4 sm:px-6 py-4 sm:py-6" onSubmit={handleRegisterSubmit}>
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0s' }}>
                <label className="text-sm font-medium text-gray-700" htmlFor="register-email">
                  Email Address
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <label className="text-sm font-medium text-gray-700" htmlFor="register-password">
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full animate-slide-up rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 font-semibold text-white shadow-md transition hover:shadow-lg hover:from-blue-700 hover:to-blue-600 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-300 disabled:shadow-none"
                style={{ animationDelay: '0.2s' }}
              >
                {submitting ? 'Creating account…' : 'Create Account'}
              </button>

              <div className="flex items-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <span className="h-px flex-1 bg-gray-200" />
                <span className="px-3 text-xs uppercase text-gray-400">or</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              <a
                href={googleAuthUrl}
                className="flex w-full animate-slide-up items-center justify-center space-x-2 rounded-lg border border-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
                style={{ animationDelay: '0.4s' }}
              >
                <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" aria-hidden="true">
                  <path
                    d="M533.5 278.4c0-17.4-1.5-34.1-4.3-50.4H272v95.4h147.4c-6.4 34.5-25.8 63.7-55.1 83.1l89 69c52-48 80.2-118.6 80.2-197.1z"
                    fill="#4285f4"
                  />
                  <path
                    d="M272 544.3c72.6 0 133.5-24 177.9-64.8l-89-69c-24.7 16.6-56.4 26.6-88.9 26.6-68.3 0-126.2-46.1-147-108.2l-91.7 71.4c43.5 86.1 133.5 144 238.7 144z"
                    fill="#34a853"
                  />
                  <path
                    d="M125 328.9c-10.8-32.4-10.8-67.4 0-99.8l-91.6-71.4C7.5 210.5 0 243.7 0 278.4s7.5 67.9 33.4 120.7L125 328.9z"
                    fill="#fbbc04"
                  />
                  <path
                    d="M272 107.7c37.9-.6 74.9 13.7 102.7 38.9l77-77C402.3 24.5 340.6 0 272 0 166.7 0 76.6 58 33.4 157.2l91.6 71.4C145.7 166.5 203.6 120.4 272 120.4z"
                    fill="#ea4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </a>
            </form>
          )}

          <div className="border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 bg-gray-50">
            {mode === 'login' ? (
              <p>
                Want to create an account instead?{' '}
                <button
                  onClick={() => onSwitchMode('register')}
                  className="font-semibold text-blue-600 transition hover:underline hover:text-blue-700"
                >
                  Register
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => onSwitchMode('login')}
                  className="font-semibold text-blue-600 transition hover:underline hover:text-blue-700"
                >
                  Log in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;
