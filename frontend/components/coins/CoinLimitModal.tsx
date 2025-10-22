'use client';

import { X, Sparkles, Wallet } from 'lucide-react';

interface CoinLimitModalProps {
  open: boolean;
  onClose: () => void;
}

const CoinLimitModal = ({ open, onClose }: CoinLimitModalProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-brand-soft bg-white shadow-2xl animate-in fade-in duration-200">
        <div className="absolute right-3 top-3">
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-brand-tint hover:text-gray-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="brand-gradient px-6 py-8 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 shadow-lg">
              <Wallet className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/70">
                SoulCoins Needed
              </p>
              <h2 className="text-2xl font-bold">You’ve reached your limit</h2>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-7">
          <p className="text-sm text-gray-600">
            You have used all of your available SoulCoins. Upgrade or top up to
            keep generating images and chatting with your companions without
            interruption.
          </p>

          <div className="rounded-2xl border border-brand-soft bg-brand-soft/80 px-4 py-3 text-sm text-brand-primary">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" />
              SoulCoins let you:
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-brand-primary/80">
              <li>Generate cinematic character artwork</li>
              <li>Send heartfelt messages to your AI companions</li>
              <li>Unlock premium conversation experiences</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
            >
              Maybe later
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-brand transition hover:shadow-lg"
            >
              Get more coins
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinLimitModal;
