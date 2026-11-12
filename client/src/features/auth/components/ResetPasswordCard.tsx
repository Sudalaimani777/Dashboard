import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordInput } from '../schemas/auth.schema';
import { authApi } from '../services/auth.api';
import { AuthLayout } from './AuthLayout';
import { AuthField } from './AuthField';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export const ResetPasswordCard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() || '';

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  const isMissingToken = !token;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: ResetPasswordInput) => {
    setErrorMessage(null);
    try {
      await authApi.resetPassword(token, data.password);
      setIsSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password.';
      if (
        msg.toLowerCase().includes('expired') ||
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('token')
      ) {
        setIsTokenExpired(true);
      } else {
        setErrorMessage(msg);
      }
    }
  };

  if (isMissingToken || isTokenExpired) {
    return (
      <AuthLayout
        title="Invalid or expired link"
        subtitle="This password recovery token is no longer valid."
      >
        <div className="space-y-5 text-left">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">
                {isMissingToken ? 'Recovery token missing' : 'Recovery token expired'}
              </p>
              <p className="text-amber-800 leading-relaxed">
                Password recovery links are single-use and expire after 1 hour. Please request a new recovery link.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              to="/forgot-password"
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Request a new link
            </Link>
            <Link
              to="/signin"
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-border-warm bg-surface text-xs font-semibold text-ink hover:bg-surface-subtle transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <ArrowLeft className="size-4" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (isSuccess) {
    return (
      <AuthLayout
        title="Password updated"
        subtitle="Your password has been updated."
      >
        <div className="space-y-5 text-left">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-950">Password reset successfully</p>
              <p className="text-emerald-800 leading-relaxed">
                You can now sign in to TripFlow with your new password.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span>Proceed to sign in</span>
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong new password for your account."
      error={errorMessage}
      onClearError={() => setErrorMessage(null)}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
        <div>
          <AuthField
            id="reset-password"
            label="New password"
            isPassword
            autoComplete="new-password"
            placeholder="Enter at least 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordStrengthMeter password={passwordValue} />
        </div>

        <AuthField
          id="reset-confirm-password"
          label="Confirm new password"
          isPassword
          toggleLabel={{ show: 'Show confirm password', hide: 'Hide confirm password' }}
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-all duration-150 shadow-xs cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Updating password...</span>
            </>
          ) : (
            <>
              <KeyRound className="size-4" />
              <span>Update password</span>
            </>
          )}
        </button>

        <div className="pt-2 text-center">
          <Link
            to="/signin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to sign in</span>
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
