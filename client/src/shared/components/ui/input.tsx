import * as React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helperText, ...props }, ref) => {
    const inputElement = (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-[#1A2C44] placeholder:text-[#50617A] shadow-xs transition-colors',
          'focus-visible:outline-none focus-visible:border-[#533AFD] focus-visible:ring-2 focus-visible:ring-[#533AFD]/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-[#DC2626] focus-visible:ring-[#DC2626]/20' : 'border-[#CBD5E1]',
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (!helperText) {
      return inputElement;
    }

    return (
      <div className="w-full flex flex-col gap-1">
        {inputElement}
        <p className="text-[11px] text-[#50617A] font-normal leading-normal">{helperText}</p>
      </div>
    );
  }
);
Input.displayName = 'Input';
