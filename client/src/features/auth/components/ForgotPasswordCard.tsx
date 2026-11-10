import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas/auth.schema';
import { authApi } from '../services/auth.api';
import { AuthLayout } from './AuthLayout';

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
        showBrandPanel={false}
        title="Check your inbox"
        subtitle="Password recovery instructions have been dispatched."
      >
        <div className="space-y-5 text-left">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 shadow-xs">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-950">
                Recovery link dispatched
              </p>
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
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-[#E8DFD3] bg-white text-xs font-semibold text-[#2B231D] hover:bg-[#FAF8F5] transition-colors shadow-xs"
            >
              Use a different email
            </button>
            <Link
              to="/signin"
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#2B231D] text-white text-xs font-semibold hover:bg-[#3D332B] transition-colors shadow-xs"
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
      showBrandPanel={false}
      title="Reset your password"
      subtitle="Enter your corporate email address to receive password reset instructions."
      error={errorMessage}
      onClearError={() => setErrorMessage(null)}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
        {/* Work Email */}
        <div className="space-y-1.5">
          <label htmlFor="forgot-email" className="block text-xs font-semibold text-[#2B231D]">
            Work email
          </label>
          <div className="relative">
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="ada@halden.co"
              className={`w-full h-11 px-3.5 rounded-xl border bg-white text-sm text-[#2B231D] placeholder:text-[#A59B90] transition-colors focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-[#E8DFD3] hover:border-[#D4C4B5] focus:border-[#8A582B] focus:ring-[#8A582B]/15'
              }`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#D95A2B] hover:bg-[#C24E22] text-white font-semibold text-sm transition-all duration-150 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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

        {/* Return to Sign in */}
        <div className="pt-2 text-center">
          <Link
            to="/signin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A582B] hover:text-[#754820] hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to sign in</span>
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
