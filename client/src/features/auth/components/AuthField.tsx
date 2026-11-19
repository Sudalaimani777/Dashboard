import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  labelRight?: React.ReactNode;
  error?: string;
  isPassword?: boolean;
  toggleLabel?: { show: string; hide: string };
}

export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(
  (
    {
      id,
      label,
      labelRight,
      error,
      isPassword = false,
      toggleLabel = { show: 'Show password', hide: 'Hide password' },
      type = 'text',
      className = '',
      ...inputProps
    },
    ref
  ) => {
    const [revealed, setRevealed] = useState(false);
    const resolvedType = isPassword ? (revealed ? 'text' : 'password') : type;

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={id} className="block text-xs font-semibold text-ink">
            {label}
          </label>
          {labelRight}
        </div>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={resolvedType}
            aria-invalid={Boolean(error)}
            className={`w-full h-11 rounded-xl border bg-surface text-sm text-ink placeholder:text-faint transition-colors focus-visible:outline-none focus-visible:ring-2 ${
              isPassword ? 'pl-3.5 pr-10' : 'px-3.5'
            } ${
              error
                ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15'
                : 'border-border-warm hover:border-primary/40 focus-visible:border-primary focus-visible:ring-primary/20'
            } ${className}`}
            {...inputProps}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setRevealed((prev) => !prev)}
              aria-label={revealed ? toggleLabel.hide : toggleLabel.show}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted hover:text-ink cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      </div>
    );
  }
);

AuthField.displayName = 'AuthField';
