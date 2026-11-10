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
    'bg-[#8A582B]',
    'bg-emerald-600',
  ];
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="mt-2.5 space-y-2 rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-3 text-left">
      {/* Strength Bar */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#756F68]">
        <span>Password strength</span>
        <span className="font-medium text-[#2B231D]">{strengthLabels[passedCount]}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              idx < passedCount ? strengthColors[passedCount] : 'bg-[#E8DFD3]'
            }`}
          />
        ))}
      </div>

      {/* Rules Checklist */}
      <ul className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-[#756F68] sm:grid-cols-2">
        {RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <li key={rule.id} className="flex items-center gap-1.5">
              {passed ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <X className="size-3.5 text-[#A59B90]" />
              )}
              <span className={passed ? 'text-[#2B231D] font-medium' : 'text-[#A59B90]'}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
