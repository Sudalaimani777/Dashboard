import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { signUpSchema, type SignUpInput } from '../schemas/auth.schema';
import { AuthLayout } from './AuthLayout';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export const SignUpCard: React.FC = () => {
  const navigate = useNavigate();
  const { signup, signin, authError, clearAuthError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

      // Auto sign-in on registration
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
      subtitle="Join TripFlow to submit and govern corporate travel requests in real time."
      error={localError || authError}
      onClearError={() => {
        setLocalError(null);
        clearAuthError();
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="signup-name" className="block text-xs font-semibold text-[#2B231D]">
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            className={`w-full h-11 px-3.5 rounded-xl border bg-white text-sm text-[#2B231D] placeholder:text-[#A59B90] transition-colors focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-[#E8DFD3] hover:border-[#D4C4B5] focus:border-[#8A582B] focus:ring-[#8A582B]/15'
            }`}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-red-600 font-medium">{errors.name.message}</p>
          )}
        </div>

        {/* Work Email */}
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="block text-xs font-semibold text-[#2B231D]">
            Work email
          </label>
          <input
            id="signup-email"
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
          <label
            htmlFor="signup-password"
            className="block text-xs font-semibold text-[#2B231D]"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a strong password"
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
            htmlFor="signup-confirm-password"
            className="block text-xs font-semibold text-[#2B231D]"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter your password"
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
