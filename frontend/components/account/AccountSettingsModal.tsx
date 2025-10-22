'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { Copy, Check, X } from 'lucide-react';
import type { AuthUser } from '@/lib/auth';

interface AccountSettingsModalProps {
  open: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

const providerConfig: Record<
  string,
  { label: string; badge: string; text: string }
> = {
  google: {
    label: 'Google',
    badge:
      'bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#EA4335] text-white',
    text: 'G',
  },
  apple: {
    label: 'Apple',
    badge: 'bg-black text-white',
    text: 'A',
  },
  email: {
    label: 'Email',
    badge: 'bg-brand-soft text-brand-primary border border-brand-soft',
    text: '@',
  },
};

const AccountSettingsModal = ({
  open,
  onClose,
  user,
}: AccountSettingsModalProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleCopyId = async () => {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Unable to copy account id', error);
    }
  };

  const provider = useMemo(() => {
    if (!user?.provider) return providerConfig.email;
    const key = user.provider.toLowerCase();
    return (
      providerConfig[key] ?? {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        badge: 'bg-purple-500/10 text-purple-600 border border-purple-200',
        text: key.charAt(0).toUpperCase(),
      }
    );
  }, [user?.provider]);

  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-3 sm:px-6 py-8 sm:py-10"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-[32px]
                   bg-gradient-to-b from-[#f4efff] via-white to-[#f0f9ff]
                   shadow-[0_40px_80px_-40px_rgba(99,102,241,0.35)]
                   border border-white/70
                   scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent
                   [@supports(-webkit-touch-callout:none)]:[-webkit-overflow-scrolling:touch]"
        onClick={stopPropagation}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 rounded-full border border-white/70 bg-white/80 p-2 text-slate-400 hover:text-slate-600 hover:shadow-md transition"
          aria-label="Close account settings"
        >
          <X size={18} />
        </button>

        <div className="px-4 sm:px-8 pt-8 sm:pt-10 pb-10 sm:pb-12 space-y-6 sm:space-y-10">
          {/* Header */}
          <div className="space-y-3 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Account Info
            </h2>
            <p className="text-sm text-slate-500">
              Manage your account details and subscription preferences.
            </p>
          </div>

          {/* Account Details */}
          <div className="rounded-[20px] sm:rounded-[28px] bg-white shadow-[0_22px_45px_-32px_rgba(79,70,229,0.35)] border border-slate-100/80 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {/* Account ID */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-5">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                  Account ID
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-slate-800 tracking-wide break-all">
                    {user?.id ?? 'Not set'}
                  </span>
                  {user?.id && (
                    <button
                      onClick={handleCopyId}
                      className="flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition"
                    >
                      {copied ? (
                        <>
                          <Check size={14} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Account Provider */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-5">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                  Account
                </span>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold shadow-inner ${provider.badge}`}
                  >
                    {provider.text}
                  </div>
                  <span className="text-base font-semibold text-slate-800">
                    {provider.label}
                  </span>
                </div>
              </div>

              {/* Delete Account */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-5">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                  Delete Account
                </span>
                <button
                  type="button"
                  onClick={() => console.info('Delete account requested')}
                  className="rounded-xl brand-gradient px-5 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold text-white shadow-brand transition hover:shadow-lg hover:scale-[1.01]"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="rounded-[20px] sm:rounded-[28px] bg-white shadow-[0_22px_45px_-32px_rgba(79,70,229,0.3)] border border-slate-100/80 overflow-hidden">
            <div className="divide-y divide-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-5">
                <span className="text-base font-semibold text-slate-900">
                  My Subscription
                </span>
                <button
                  type="button"
                  className="rounded-xl brand-gradient px-5 py-2 text-sm font-semibold text-white shadow-brand transition hover:shadow-lg hover:scale-[1.01]"
                >
                  Subscribe
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-5">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                  Plan
                </span>
                <span className="text-base font-semibold text-slate-800">
                  Free
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsModal;
