import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { signInSchema, type SignInInput } from '../schemas/auth.schema';
import { AuthLayout } from './AuthLayout';

export const SignInCard: React.FC = () => {
  const navigate = useNavigate();
  const { signin, authError, clearAuthError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: true,
    },
    mode: 'onTouched',
  });

  const onSubmit = async (values: SignInInput) => {
    setLocalError(null);
    clearAuthError();
    try {
      await signin({
        email: values.email,
        password: values.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password.';
      setLocalError(msg);
    }
  };

  return (
    <AuthLayout
      mode="sign-in"
      title="Welcome back"
      subtitle="Corporate travel governance and real-time expense headroom enforcement."
      error={localError || authError}
      onClearError={() => {
        setLocalError(null);
        clearAuthError();
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
        {/* Work Email */}
        <div className="space-y-1.5">
          <label htmlFor="signin-email" className="block text-xs font-semibold text-[#2B231D]">
            Work email
          </label>
          <input
            id="signin-email"
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
          {errors.email && (
            <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="signin-password"
              className="block text-xs font-semibold text-[#2B231D]"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-[#8A582B] hover:text-[#754820] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
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
          {errors.password && (
            <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="size-4 rounded border-[#E8DFD3] text-[#8A582B] focus:ring-[#8A582B]/20 accent-[#8A582B]"
              {...register('remember')}
            />
            <span className="text-xs font-medium text-[#2B231D]">
              Keep me signed in for 30 days
            </span>
          </label>
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
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign in</span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};
