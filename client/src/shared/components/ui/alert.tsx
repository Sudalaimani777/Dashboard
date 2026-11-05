import * as React from 'react';
import { cn } from '../../utils/cn';

export const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative w-full rounded-xl border border-[#9E2A2B]/20 bg-[#FDF2F2] p-4 text-sm text-[#9E2A2B]',
        className
      )}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-xs font-medium leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';
