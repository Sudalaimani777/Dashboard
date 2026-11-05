import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Input, type InputProps } from './input';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          disabled={disabled}
          className={cn('pr-10', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#756F68] hover:text-[#2B231D] transition-colors cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';
