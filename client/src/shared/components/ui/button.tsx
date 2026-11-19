import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#533AFD] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[#533AFD] text-white hover:bg-[#4834DB] shadow-xs active:scale-[0.98]',
        primary: 'bg-[#533AFD] text-white hover:bg-[#4834DB] shadow-xs active:scale-[0.98]',
        destructive: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-xs',
        outline: 'border border-[#E5EDF5] bg-white text-[#1A2C44] hover:bg-[#F2F7FE] hover:border-[#839BC8]/40',
        secondary: 'bg-[#E5EDF5] text-[#061B31] border border-[#839BC8]/30 hover:bg-[#D6D9FC]',
        ghost: 'text-[#1A2C44] bg-transparent hover:bg-[#F2F7FE] hover:text-[#061B31]',
        link: 'text-[#533AFD] underline-offset-4 hover:underline hover:text-[#4834DB] p-0 h-auto',
      },
      size: {
        default: 'h-11 px-5 py-2 text-sm',
        sm: 'h-9 px-3.5 text-xs rounded-lg',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-base font-semibold rounded-xl',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
export default Button;
