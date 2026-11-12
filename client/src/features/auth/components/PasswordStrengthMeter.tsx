import React from 'react';
import { Check, X } from 'lucide-react';

export interface PasswordStrengthMeterProps {
  password?: string;
}

const RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'case', label: 'Upper and lower case', test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: 'number', label: 'A number', test: (p: string) => /\d/.test(p) },
  { id: 'symbol', label: 'A special symbol', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  if (!password) return null;

  const passedCount = RULES.filter((r) => r.test(password)).length;
  const strengthColors = [
    'bg-red-400',
    'bg-red-500',
    'bg-amber-500',
    'bg-primary',
    'bg-emerald-600',
  ];
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="mt-2.5 space-y-2 rounded-xl border border-border-warm bg-surface-subtle p-3 text-left">
      <div className="flex items-center justify-between text-[11px] font-semibold text-muted">
        <span>Password strength</span>
        <span className="font-medium text-ink">{strengthLabels[passedCount]}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              idx < passedCount ? strengthColors[passedCount] : 'bg-border-warm'
            }`}
          />
        ))}
      </div>

      <ul className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-muted sm:grid-cols-2">
        {RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <li key={rule.id} className="flex items-center gap-1.5">
              {passed ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <X className="size-3.5 text-faint" />
              )}
              <span className={passed ? 'text-ink font-medium' : 'text-faint'}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
