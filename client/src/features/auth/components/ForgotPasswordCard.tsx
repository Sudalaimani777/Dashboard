import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas/auth.schema';
import { authApi } from '../services/auth.api';
import { AuthLayout } from './AuthLayout';
import { AuthField } from './AuthField';

export const ForgotPasswordCard: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setErrorMessage(null);
    try {
      await authApi.forgotPassword(data.email);
      setSubmittedEmail(data.email);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to send recovery link. Please try again.';
      setErrorMessage(msg);
    }
  };

  const handleUseDifferentEmail = () => {
    setSubmittedEmail(null);
    reset();
    setErrorMessage(null);
  };

  if (submittedEmail) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle="Password recovery instructions have been sent."
      >
        <div className="space-y-5 text-left">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-950">Recovery link sent</p>
              <p className="text-emerald-800 leading-relaxed">
                If an account exists for{' '}
                <strong className="font-semibold text-emerald-950">{submittedEmail}</strong>,
                a password reset link will arrive shortly.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleUseDifferentEmail}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-border-warm bg-surface text-xs font-semibold text-ink hover:bg-surface-subtle transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Use a different email
            </button>
            <Link
              to="/signin"
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <ArrowLeft className="size-4" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your work email to receive a password reset link."
      error={errorMessage}
      onClearError={() => setErrorMessage(null)}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
        <AuthField
          id="forgot-email"
          type="email"
          label="Work email"
          autoComplete="email"
          placeholder="name@company.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-all duration-150 shadow-xs cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Sending recovery link...</span>
            </>
          ) : (
            <>
              <Mail className="size-4" />
              <span>Send recovery link</span>
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
