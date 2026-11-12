import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { signUpSchema, type SignUpInput } from '../schemas/auth.schema';
import { AuthLayout } from './AuthLayout';
import { AuthField } from './AuthField';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export const SignUpCard: React.FC = () => {
  const navigate = useNavigate();
  const { signup, signin, authError, clearAuthError } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  });

  const passwordValue = watch('password');

  const onSubmit = async (values: SignUpInput) => {
    setLocalError(null);
    clearAuthError();
    try {
      await signup({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      try {
        await signin({
          email: values.email,
          password: values.password,
        });
        navigate('/dashboard', { replace: true });
      } catch {
        navigate('/signin', { replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setLocalError(msg);
    }
  };

  return (
    <AuthLayout
      mode="sign-up"
      title="Create account"
      subtitle="Set up your TripFlow account to submit and track travel requests."
      error={localError || authError}
      onClearError={() => {
        setLocalError(null);
        clearAuthError();
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
        <AuthField
          id="signup-name"
          type="text"
          label="Full name"
          autoComplete="name"
          placeholder="Your full name"
          error={errors.name?.message}
          {...register('name')}
        />

        <AuthField
          id="signup-email"
          type="email"
          label="Work email"
          autoComplete="email"
          placeholder="name@company.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <AuthField
            id="signup-password"
            label="Password"
            isPassword
            autoComplete="new-password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordStrengthMeter password={passwordValue} />
        </div>

        <AuthField
          id="signup-confirm-password"
          label="Confirm password"
          isPassword
          toggleLabel={{ show: 'Show confirm password', hide: 'Hide confirm password' }}
          autoComplete="new-password"
          placeholder="Re-enter your password"
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
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create account</span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default SignUpCard;
