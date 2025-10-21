'use client';

import { Sparkles, Wand2, Video, Image, Bot, Clock, PlusCircle, X, CreditCard, Wallet, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface ProBenefitsModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPlan?: (planId: string) => void;
  initialPlanId?: 'monthly' | 'annual';
}

type PlanOption = {
  id: string;
  label: string;
  sublabel: string;
  price: string;
  cadence: string;
  badge?: string;
  savings?: string;
};

const ProBenefitsModal = ({ open, onClose, onSelectPlan, initialPlanId }: ProBenefitsModalProps) => {
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  useEffect(() => {
    let timeoutId: number | undefined;
    let rafId: number | undefined;

    if (open) {
      setIsMounted(true);
      rafId = window.requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      timeoutId = window.setTimeout(() => setIsMounted(false), 300);
    }

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      if (rafId !== undefined) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setSelectedPlan(initialPlanId ?? 'annual');
    }
  }, [open, initialPlanId]);

  const planOptions: PlanOption[] = useMemo(
    () => [
      {
        id: 'monthly',
        label: '1 month',
        sublabel: 'First month $9.99 then $19.99',
        price: '$9.99',
        cadence: 'per month',
        badge: '75% off',
      },
      {
        id: 'annual',
        label: '12 months',
        sublabel: 'First year $59.99 then $119.99',
        price: '$4.99',
        cadence: 'per month (billed annually)',
        badge: 'Best value',
        savings: 'Save 75%',
      },
    ],
    []
  );

  if (!isMounted) {
    return null;
  }

  const handlePlanSelect = (planId: 'monthly' | 'annual') => {
    setSelectedPlan(planId);
    onSelectPlan?.(planId);
  };

  return (
    <div className={`fixed inset-0 z-[120] flex items-center justify-center px-3 py-6 sm:px-6 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <div className={`relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-blue-200/40 bg-white shadow-2xl ${isVisible ? 'animate-scale-up' : 'animate-scale-down'} max-h-[90vh] overflow-y-auto`}>
        <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
          <button
            onClick={onClose}
            className="rounded-full bg-white/80 p-2 text-gray-500 shadow-md transition hover:bg-blue-50 hover:text-gray-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 sm:px-6 py-4 sm:py-5 text-white">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 shadow-xl">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">SoulFun Pro</p>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Unlock premium experiences</h2>
              </div>
            </div>
            <div className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase">
              Limited-time pricing
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Pro benefits</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    icon: <Wand2 className="h-4 w-4" />,
                    title: 'Create characters',
                    description: 'Craft bespoke personalities with custom traits.',
                  },
                  {
                    icon: <Video className="h-4 w-4" />,
                    title: 'Video memories',
                    description: 'Save highlights for up to 20 seconds.',
                  },
                  {
                    icon: <Image className="h-4 w-4" />,
                    title: 'Image generation',
                    description: 'Produce cinematic portraits.',
                  },
                  {
                    icon: <Bot className="h-4 w-4" />,
                    title: 'Photos & responses',
                    description: 'Get contextual replies with visuals.',
                  },
                  {
                    icon: <Clock className="h-4 w-4" />,
                    title: 'Priority access',
                    description: 'Be first for new AI abilities.',
                  },
                  {
                    icon: <PlusCircle className="h-4 w-4" />,
                    title: '1,000 coins/month',
                    description: 'Keep chatting without limits.',
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="flex gap-2 rounded-xl border border-blue-100/60 bg-blue-50/40 px-3 py-2"
                  >
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                      {feature.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{feature.title}</p>
                      <p className="text-[10px] text-gray-600 leading-tight">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Choose plan</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {planOptions.map((plan) => {
                  const active = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => handlePlanSelect(plan.id as 'monthly' | 'annual')}
                      className={`relative flex flex-col items-start rounded-xl border px-4 py-3 text-left shadow-sm transition-all duration-200 ${
                        active
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 shadow-md ring-2 ring-blue-300/50'
                          : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-md'
                      }`}
                    >
                      {plan.badge && (
                        <span
                          className={`mb-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            active
                              ? 'bg-blue-600/90 text-white'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {plan.badge}
                        </span>
                      )}
                      <p className="text-base font-semibold text-gray-900">{plan.label}</p>
                      <p className="mt-1 text-xs text-gray-500 leading-tight">{plan.sublabel}</p>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-blue-600">{plan.price}</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                          {plan.cadence}
                        </span>
                      </div>
                      {plan.savings && (
                        <span className="mt-2 inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                          {plan.savings}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-blue-600">
                <CreditCard className="h-3.5 w-3.5" />
                Pay with Card
              </button>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50">
                <Wallet className="h-3.5 w-3.5" />
                Pay with Wallet
              </button>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100">
                More options
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProBenefitsModal;
