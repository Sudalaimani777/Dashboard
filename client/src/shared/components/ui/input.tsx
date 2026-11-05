import * as React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border bg-[#FAF8F5] px-3.5 py-2 text-sm text-[#2B231D] placeholder:text-[#756F68]/60 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A582B] focus-visible:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-[#9E2A2B] focus-visible:ring-[#9E2A2B]' : 'border-[#E8DFD3]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
