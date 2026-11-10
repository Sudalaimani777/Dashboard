import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordInput } from '../schemas/auth.schema';
import { authApi } from '../services/auth.api';
import { AuthLayout } from './AuthLayout';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export const ResetPasswordCard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // State: Missing or Expired Token
  if (isMissingToken || isTokenExpired) {
    return (
      <AuthLayout
        showBrandPanel={false}
        title="Invalid or expired link"
        subtitle="This password recovery token is no longer valid."
      >
        <div className="space-y-5 text-left">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-xs">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">
                {isMissingToken ? 'Recovery token missing' : 'Recovery token expired'}
              </p>
              <p className="text-amber-800 leading-relaxed">
                Password recovery links are single-use and expire within 1 hour for security. Please request a new recovery link.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              to="/forgot-password"
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#2B231D] text-white text-xs font-semibold hover:bg-[#3D332B] transition-colors shadow-xs"
            >
              Request a new link
            </Link>
            <Link
              to="/signin"
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-[#E8DFD3] bg-white text-xs font-semibold text-[#2B231D] hover:bg-[#FAF8F5] transition-colors shadow-xs"
            >
              <ArrowLeft className="size-4" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // State: Password successfully reset
  if (isSuccess) {
    return (
      <AuthLayout
        showBrandPanel={false}
        title="Password updated"
        subtitle="Your credentials have been securely updated."
      >
        <div className="space-y-5 text-left">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 shadow-xs">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-950">
                Password reset successfully
              </p>
              <p className="text-emerald-800 leading-relaxed">
                You can now sign in to your TripFlow corporate governance portal using your new password.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#2B231D] text-white text-xs font-semibold hover:bg-[#3D332B] transition-colors shadow-xs"
          >
            <span>Proceed to sign in</span>
          </button>
        </div>
      </AuthLayout>
    );
  }

  // State: Active Reset Form
  return (
    <AuthLayout
      showBrandPanel={false}
      title="Set a new password"
      subtitle="Ensure your new password meets corporate compliance criteria."
      error={errorMessage}
      onClearError={() => setErrorMessage(null)}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
        {/* New Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="reset-password"
            className="block text-xs font-semibold text-[#2B231D]"
          >
            New password
          </label>
          <div className="relative">
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Enter at least 8 characters"
              className={`w-full h-11 pl-3.5 pr-10 rounded-xl border bg-white text-sm text-[#2B231D] placeholder:text-[#A59B90] transition-colors focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-[#E8DFD3] hover:border-[#D4C4B5] focus:border-[#8A582B] focus:ring-[#8A582B]/15'
              }`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#756F68] hover:text-[#2B231D]"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <PasswordStrengthMeter password={passwordValue} />
          {errors.password && (
            <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="reset-confirm-password"
            className="block text-xs font-semibold text-[#2B231D]"
          >
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="reset-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              className={`w-full h-11 pl-3.5 pr-10 rounded-xl border bg-white text-sm text-[#2B231D] placeholder:text-[#A59B90] transition-colors focus:outline-none focus:ring-2 ${
                errors.confirmPassword
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-[#E8DFD3] hover:border-[#D4C4B5] focus:border-[#8A582B] focus:ring-[#8A582B]/15'
              }`}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#756F68] hover:text-[#2B231D]"
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#D95A2B] hover:bg-[#C24E22] text-white font-semibold text-sm transition-all duration-150 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
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
