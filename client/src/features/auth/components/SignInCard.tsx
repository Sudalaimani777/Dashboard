import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { signInSchema, type SignInInput } from '../schemas/auth.schema';
import { AuthLayout } from './AuthLayout';
import { AuthField } from './AuthField';

export const SignInCard: React.FC = () => {
  const navigate = useNavigate();
  const { signin, authError, clearAuthError } = useAuth();
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
      title="Sign in"
      subtitle="Access your travel requests, team approvals, and budgets."
      error={localError || authError}
      onClearError={() => {
        setLocalError(null);
        clearAuthError();
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
        <AuthField
          id="signin-email"
          type="email"
          label="Work email"
          autoComplete="email"
          placeholder="name@company.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <AuthField
          id="signin-password"
          label="Password"
          isPassword
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          labelRight={
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Forgot password?
            </Link>
          }
          {...register('password')}
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="size-4 rounded border-border-warm text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
              {...register('remember')}
            />
            <span className="text-xs font-medium text-ink">
              I agree to the Terms &amp; Conditions.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-all duration-150 shadow-xs cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
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
